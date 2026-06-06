import {
  holdMediaSession,
  persistMediaSessionSnapshot,
  releaseMediaSession,
  updateMediaSessionPlaybackState,
} from "@/lib/media-session";
import { startAudioKeepalive, stopAudioKeepalive } from "@/lib/player/audio-keepalive";
import {
  acquirePlaybackLock,
  releasePlaybackLock,
} from "@/lib/player/playback-lock";
import { playerController } from "@/lib/player/player-controller";
import { YT_PLAYER_STATE } from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";

let loadedVideoId: string | null = null;
let suppressYtEvents = false;
let keepaliveTimer: number | null = null;
let wakeLock: WakeLockSentinel | null = null;
let stalledTicks = 0;

export function setSuppressYtEvents(ms = 400) {
  suppressYtEvents = true;
  window.setTimeout(() => {
    suppressYtEvents = false;
  }, ms);
}

export function isDocumentHidden() {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
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

function snapshotNow() {
  const { currentTrack, isPlaying, duration, currentTime } = usePlayerStore.getState();
  if (!currentTrack) return;
  persistMediaSessionSnapshot(currentTrack, isPlaying, duration, currentTime);
}

function currentEngineTime() {
  if (!playerController.isReady()) {
    return usePlayerStore.getState().lastKnownTime;
  }
  const live = playerController.getCurrentTime();
  return Number.isFinite(live) && live > 0 ? live : usePlayerStore.getState().lastKnownTime;
}

/** Hard reload — required after OS suspends the YouTube iframe in background. */
export function forceEngineResume() {
  const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();
  if (!currentTrack || !isPlaying || !isReady || !playerController.isReady()) return;

  const videoId = currentTrack.videoId;
  const startAt = currentEngineTime();

  loadedVideoId = null;
  setSuppressYtEvents(900);
  playerController.loadVideo(videoId, startAt);
  playerController.play();
  loadedVideoId = videoId;

  updateMediaSessionPlaybackState(true);
  snapshotNow();
  stalledTicks = 0;
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
    forceEngineResume();
    return;
  }

  setSuppressYtEvents(250);
  playerController.play();
  updateMediaSessionPlaybackState(true);
}

/** Single entry point — all play/pause/track changes go through here. */
export function applyPlaybackIntent() {
  const { currentTrack, isPlaying, lastKnownTime, isReady } = usePlayerStore.getState();

  if (!currentTrack) {
    teardownPlayerSession();
    return;
  }

  if (!sessionActive()) {
    holdMediaSession(currentTrack);
    startSessionKeepalive();
  }

  snapshotNow();

  if (isPlaying) {
    startAudioKeepalive();
    acquirePlaybackLock();
    void acquireWakeLock();
  } else {
    stopAudioKeepalive();
    releasePlaybackLock();
    void releaseWakeLock();
  }

  if (!isReady || !playerController.isReady()) return;

  if (!isPlaying) {
    setSuppressYtEvents(200);
    playerController.pause();
    updateMediaSessionPlaybackState(false);
    return;
  }

  updateMediaSessionPlaybackState(true);

  const startAt = lastKnownTime > 0 ? lastKnownTime : 0;
  const videoId = currentTrack.videoId;

  if (loadedVideoId === videoId) {
    nudgeEngine();
    return;
  }

  loadedVideoId = videoId;
  stalledTicks = 0;
  setSuppressYtEvents(700);
  playerController.loadVideo(videoId, startAt);
}

export function handleYtStateChange(state: number) {
  if (suppressYtEvents) return;

  const store = usePlayerStore.getState();
  if (!store.currentTrack) return;

  if (state === YT_PLAYER_STATE.ENDED) {
    usePlayerStore.getState().next();
    window.setTimeout(() => applyPlaybackIntent(), 0);
    return;
  }

  if (state === YT_PLAYER_STATE.PLAYING) {
    stalledTicks = 0;
    if (!store.isPlaying) {
      usePlayerStore.setState({ isPlaying: true });
    }
    snapshotNow();
    return;
  }

  if (state === YT_PLAYER_STATE.PAUSED && store.isPlaying) {
    if (isDocumentHidden()) {
      snapshotNow();
      forceEngineResume();
      window.setTimeout(() => forceEngineResume(), 200);
      window.setTimeout(() => forceEngineResume(), 600);
      return;
    }

    snapshotNow();
    window.setTimeout(() => {
      const latest = usePlayerStore.getState();
      if (latest.isPlaying && latest.currentTrack) {
        nudgeEngine();
      }
    }, 120);
  }
}

function sessionActive() {
  return keepaliveTimer != null;
}

function startSessionKeepalive() {
  if (keepaliveTimer) return;

  keepaliveTimer = window.setInterval(() => {
    const { currentTrack, isPlaying } = usePlayerStore.getState();

    if (!currentTrack) {
      teardownPlayerSession();
      return;
    }

    snapshotNow();

    if (!isPlaying) return;

    startAudioKeepalive();
    nudgeEngine();
  }, isDocumentHidden() ? 250 : 500);
}

export function teardownPlayerSession() {
  if (keepaliveTimer) {
    window.clearInterval(keepaliveTimer);
    keepaliveTimer = null;
  }
  loadedVideoId = null;
  stalledTicks = 0;
  stopAudioKeepalive();
  releasePlaybackLock();
  void releaseWakeLock();
  releaseMediaSession();
}

export function initPlayerEngineSubscription() {
  return usePlayerStore.subscribe((state, prev) => {
    if (!state.hasHydrated) return;

    if (!state.currentTrack && prev.currentTrack) {
      teardownPlayerSession();
      return;
    }

    if (state.currentTrack && state.currentTrack.videoId !== prev.currentTrack?.videoId) {
      holdMediaSession(state.currentTrack);
      if (!keepaliveTimer) startSessionKeepalive();
    }

    const trackChanged = state.currentTrack?.videoId !== prev.currentTrack?.videoId;
    const playChanged = state.isPlaying !== prev.isPlaying;
    const readyChanged = state.isReady !== prev.isReady;

    if (trackChanged || playChanged || readyChanged) {
      applyPlaybackIntent();
    }
  });
}

export function resetLoadedVideo() {
  loadedVideoId = null;
  stalledTicks = 0;
}

export function handlePlaybackLifecycleEvent() {
  const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();
  if (!currentTrack || !isReady || !playerController.isReady()) return;

  if (document.visibilityState === "hidden" && isPlaying) {
    startAudioKeepalive();
    snapshotNow();
    forceEngineResume();
    return;
  }

  if (document.visibilityState === "visible" && isPlaying) {
    forceEngineResume();
    void acquireWakeLock();
  }
}

export function initPlaybackLifecycleListeners() {
  const onLifecycle = () => handlePlaybackLifecycleEvent();

  const onBlur = () => {
    const { isPlaying, currentTrack, isReady } = usePlayerStore.getState();
    if (isPlaying && currentTrack && isReady && playerController.isReady()) {
      startAudioKeepalive();
      applyPlaybackIntent();
    }
  };

  document.addEventListener("visibilitychange", onLifecycle);
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onLifecycle);
  window.addEventListener("pageshow", onLifecycle);

  return () => {
    document.removeEventListener("visibilitychange", onLifecycle);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", onLifecycle);
    window.removeEventListener("pageshow", onLifecycle);
  };
}
