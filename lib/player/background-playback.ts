import type { MusicTrack } from "@/types/music";

import {
  holdMediaSession,
  persistMediaSessionSnapshot,
  releaseMediaSession,
  updateMediaSessionPlaybackState,
} from "@/lib/media-session";
import { acquirePlaybackLock, releasePlaybackLock } from "@/lib/player/playback-lock";
import { playerController } from "@/lib/player/player-controller";
import { YT_PLAYER_STATE } from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";

let loadedVideoId: string | null = null;
let backgroundTimer: number | null = null;
let wakeLock: WakeLockSentinel | null = null;

export function getLoadedVideoId() {
  return loadedVideoId;
}

export function setLoadedVideoId(videoId: string | null) {
  loadedVideoId = videoId;
}

export function resetLoadedVideo() {
  loadedVideoId = null;
}

function isDocumentHidden() {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
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

/** Nudge HTML5 audio — same pattern Spotify uses (native audio element + Media Session). */
export function forceBackgroundResume() {
  const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();
  if (!currentTrack || !isPlaying || !isReady || !playerController.isReady()) return;

  const state = playerController.getPlayerState();
  if (state === YT_PLAYER_STATE.PLAYING) {
    snapshotMediaSession();
    return;
  }

  playerController.play();
  updateMediaSessionPlaybackState(true);
  snapshotMediaSession();
}

function nudgeEngine() {
  const { isPlaying, isReady } = usePlayerStore.getState();
  if (!isPlaying || !isReady || !playerController.isReady()) return;

  const state = playerController.getPlayerState();
  if (state === YT_PLAYER_STATE.PLAYING) {
    return;
  }

  playerController.play();
  updateMediaSessionPlaybackState(true);
}

export function onPlaybackStarted(track: MusicTrack) {
  holdMediaSession(track);
  acquirePlaybackLock();
  void acquireWakeLock();
  startBackgroundMonitor();
  updateMediaSessionPlaybackState(true);
  snapshotMediaSession();
}

export function onPlaybackStopped() {
  releasePlaybackLock();
  void releaseWakeLock();
  stopBackgroundMonitor();
  updateMediaSessionPlaybackState(false);
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

    nudgeEngine();
  }, isDocumentHidden() ? 1000 : 2000);
}

function stopBackgroundMonitor() {
  if (!backgroundTimer) return;
  window.clearInterval(backgroundTimer);
  backgroundTimer = null;
}

export function handleVisibilityChange() {
  const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();
  if (!currentTrack || !isReady || !playerController.isReady()) return;

  if (isPlaying) {
    forceBackgroundResume();
    void acquireWakeLock();
  }
}
