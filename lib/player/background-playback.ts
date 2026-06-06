import type { MusicTrack } from "@/types/music";

import {
  holdMediaSession,
  persistMediaSessionSnapshot,
  releaseMediaSession,
  updateMediaSessionPlaybackState,
} from "@/lib/media-session";
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

/** Reload the YouTube iframe after the OS suspends it in the background. */
export function forceBackgroundResume() {
  const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();
  if (!currentTrack || !isPlaying || !isReady || !playerController.isReady()) return;

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

function nudgeEngine() {
  const { isPlaying, isReady } = usePlayerStore.getState();
  if (!isPlaying || !isReady || !playerController.isReady()) return;

  const ytState = playerController.getPlayerState();
  if (ytState === YT_PLAYER_STATE.PLAYING || ytState === YT_PLAYER_STATE.BUFFERING) {
    stalledTicks = 0;
    return;
  }

  stalledTicks += 1;

  if (isDocumentHidden() && stalledTicks >= 2) {
    forceBackgroundResume();
    return;
  }

  setSuppressYtEvents(250);
  playerController.play();
  updateMediaSessionPlaybackState(true);
}

export function onPlaybackStarted(track: MusicTrack) {
  holdMediaSession(track);
  startAudioKeepalive();
  acquirePlaybackLock();
  void acquireWakeLock();
  startBackgroundMonitor();
}

export function onPlaybackStopped() {
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

    startAudioKeepalive();
    nudgeEngine();
  }, isDocumentHidden() ? 250 : 500);
}

function stopBackgroundMonitor() {
  if (!backgroundTimer) return;
  window.clearInterval(backgroundTimer);
  backgroundTimer = null;
}

export function handleVisibilityChange() {
  const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();
  if (!currentTrack || !isReady || !playerController.isReady()) return;

  if (document.visibilityState === "hidden" && isPlaying) {
    startAudioKeepalive();
    snapshotMediaSession();
    forceBackgroundResume();
    return;
  }

  if (document.visibilityState === "visible" && isPlaying) {
    forceBackgroundResume();
    void acquireWakeLock();
  }
}
