import type { MusicTrack } from "@/types/music";

import {
  holdMediaSession,
  persistMediaSessionSnapshot,
  releaseMediaSession,
  updateMediaSessionPlaybackState,
} from "@/lib/media-session";
import {
  isBackgroundAudioActive,
  pauseBackgroundAudio,
  prefetchBackgroundStream,
  resumeBackgroundAudio,
  startBackgroundAudio,
  stopBackgroundAudio,
} from "@/lib/player/background-audio-engine";
import { startAudioKeepalive, stopAudioKeepalive } from "@/lib/player/audio-keepalive";
import { setSuppressYtEvents } from "@/lib/player/engine-sync";
import { acquirePlaybackLock, releasePlaybackLock } from "@/lib/player/playback-lock";
import { playerController } from "@/lib/player/player-controller";
import { YT_PLAYER_STATE } from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";

let loadedVideoId: string | null = null;
let backgroundTimer: number | null = null;
let wakeLock: WakeLockSentinel | null = null;
let stalledTicks = 0;
let switchingMode = false;

export function getLoadedVideoId() {
  return loadedVideoId;
}

export function setLoadedVideoId(videoId: string | null) {
  loadedVideoId = videoId;
}

export function resetLoadedVideo() {
  loadedVideoId = null;
  stalledTicks = 0;
}

function isDocumentHidden() {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

function currentEngineTime() {
  if (!playerController.isReady()) {
    return usePlayerStore.getState().lastKnownTime;
  }
  const live = playerController.getCurrentTime();
  return Number.isFinite(live) && live > 0 ? live : usePlayerStore.getState().lastKnownTime;
}

export function snapshotMediaSession() {
  const { currentTrack, isPlaying, duration, currentTime } = usePlayerStore.getState();
  if (!currentTrack) return;
  persistMediaSessionSnapshot(currentTrack, isPlaying, duration, currentTime);
}

async function acquireWakeLock() {
  if (!("wakeLock" in navigator) || isDocumentHidden()) return;
  try {
    if (!wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    }
  } catch {
    // Denied or unsupported.
  }
}

async function releaseWakeLock() {
  try {
    await wakeLock?.release();
  } catch {
    // ignore
  }
  wakeLock = null;
}

/** Fallback: reload the YouTube iframe when background audio is unavailable. */
export function forceBackgroundResume() {
  const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();
  if (!currentTrack || !isPlaying || !isReady || !playerController.isReady()) return;
  if (isBackgroundAudioActive()) return;

  const videoId = currentTrack.videoId;
  const startAt = currentEngineTime();

  loadedVideoId = null;
  setSuppressYtEvents(900);
  playerController.loadVideo(videoId, startAt);
  playerController.play();
  loadedVideoId = videoId;
  stalledTicks = 0;

  updateMediaSessionPlaybackState(true);
  snapshotMediaSession();
}

async function enterBackgroundPlayback() {
  if (switchingMode) return;
  switchingMode = true;

  try {
    const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();
    if (!currentTrack || !isPlaying || !isReady) return;

    const startAt = currentEngineTime();
    setSuppressYtEvents(800);
    playerController.pause();

    const ok = await startBackgroundAudio(currentTrack.videoId, startAt);
    if (ok) {
      stopAudioKeepalive();
      snapshotMediaSession();
      updateMediaSessionPlaybackState(true);
      return;
    }

    startAudioKeepalive();
    forceBackgroundResume();
  } finally {
    switchingMode = false;
  }
}

async function exitBackgroundPlayback() {
  if (switchingMode) return;
  switchingMode = true;

  try {
    const store = usePlayerStore.getState();
    if (!store.currentTrack || !store.isPlaying) return;

    if (isBackgroundAudioActive()) {
      const time = stopBackgroundAudio();
      store.setLastKnownTime(time);
      store.setCurrentTime(time);

      if (playerController.isReady()) {
        setSuppressYtEvents(700);
        playerController.seekTo(time);
        playerController.play();
        loadedVideoId = store.currentTrack.videoId;
      }
      return;
    }

    forceBackgroundResume();
  } finally {
    switchingMode = false;
  }
}

function nudgeEngine() {
  const { isPlaying, isReady } = usePlayerStore.getState();
  if (!isPlaying || !isReady) return;

  if (isBackgroundAudioActive()) {
    void resumeBackgroundAudio();
    snapshotMediaSession();
    return;
  }

  if (!playerController.isReady()) return;

  const ytState = playerController.getPlayerState();
  if (ytState === YT_PLAYER_STATE.PLAYING || ytState === YT_PLAYER_STATE.BUFFERING) {
    stalledTicks = 0;
    return;
  }

  stalledTicks += 1;

  if (isDocumentHidden() && stalledTicks >= 2) {
    void enterBackgroundPlayback();
    return;
  }

  setSuppressYtEvents(250);
  playerController.play();
  updateMediaSessionPlaybackState(true);
}

export function onPlaybackStarted(track: MusicTrack) {
  holdMediaSession(track);
  prefetchBackgroundStream(track.videoId);
  startAudioKeepalive();
  acquirePlaybackLock();
  void acquireWakeLock();
  startBackgroundMonitor();
}

export function onPlaybackStopped() {
  if (isBackgroundAudioActive()) {
    stopBackgroundAudio();
  }
  stopAudioKeepalive();
  releasePlaybackLock();
  void releaseWakeLock();
  stopBackgroundMonitor();
}

export function teardownPlayerSession() {
  stopBackgroundMonitor();
  onPlaybackStopped();
  resetLoadedVideo();
  releaseMediaSession();
}

function startBackgroundMonitor() {
  if (backgroundTimer) return;

  backgroundTimer = window.setInterval(() => {
    const { currentTrack, isPlaying } = usePlayerStore.getState();

    if (!currentTrack) {
      teardownPlayerSession();
      return;
    }

    snapshotMediaSession();

    if (!isPlaying) return;

    if (!isBackgroundAudioActive()) {
      startAudioKeepalive();
    }

    nudgeEngine();
  }, isDocumentHidden() ? 500 : 1000);
}

function stopBackgroundMonitor() {
  if (!backgroundTimer) return;
  window.clearInterval(backgroundTimer);
  backgroundTimer = null;
}

export function handleVisibilityChange() {
  const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();
  if (!currentTrack || !isReady) return;

  if (document.visibilityState === "hidden" && isPlaying) {
    void enterBackgroundPlayback();
    return;
  }

  if (document.visibilityState === "visible" && isPlaying) {
    void exitBackgroundPlayback();
    void acquireWakeLock();
  }
}

export function initBackgroundTrackWatch() {
  return usePlayerStore.subscribe((state, prev) => {
    if (!isDocumentHidden() || !state.isPlaying || !state.currentTrack) return;

    const trackChanged = state.currentTrack.videoId !== prev.currentTrack?.videoId;
    const started = state.isPlaying && !prev.isPlaying;
    const stopped = !state.isPlaying && prev.isPlaying;

    if (trackChanged || started) {
      void startBackgroundAudio(state.currentTrack.videoId, state.lastKnownTime);
      return;
    }

    if (stopped) {
      pauseBackgroundAudio();
    }
  });
}
