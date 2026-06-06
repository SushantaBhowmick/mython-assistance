import {
  holdMediaSession,
  persistMediaSessionSnapshot,
  releaseMediaSession,
  updateMediaSessionPlaybackState,
} from "@/lib/media-session";
import { startAudioKeepalive, stopAudioKeepalive } from "@/lib/player/audio-keepalive";
import { playerController } from "@/lib/player/player-controller";
import { YT_PLAYER_STATE } from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";

let loadedVideoId: string | null = null;
let suppressYtEvents = false;
let keepaliveTimer: number | null = null;
let wakeLock: WakeLockSentinel | null = null;

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
  if (!("wakeLock" in navigator)) return;
  try {
    if (!wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    }
  } catch {
    // Denied or unsupported — non-fatal.
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

/** Single entry point — all play/pause/track changes go through here. */
export function applyPlaybackIntent() {
  const { currentTrack, isPlaying, lastKnownTime, isReady, duration, currentTime } =
    usePlayerStore.getState();

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
    void acquireWakeLock();
  } else {
    stopAudioKeepalive();
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
    setSuppressYtEvents(300);
    playerController.play();
    return;
  }

  loadedVideoId = videoId;
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

  if (state === YT_PLAYER_STATE.PLAYING && !store.isPlaying) {
    usePlayerStore.setState({ isPlaying: true });
    snapshotNow();
    return;
  }

  if (state === YT_PLAYER_STATE.PAUSED && store.isPlaying) {
    // OS backgrounded the app — keep user intent + notification, force resume.
    if (isDocumentHidden()) {
      snapshotNow();
      applyPlaybackIntent();
      window.setTimeout(() => applyPlaybackIntent(), 100);
      window.setTimeout(() => applyPlaybackIntent(), 400);
      return;
    }

    // Foreground spurious pause during load — nudge once.
    snapshotNow();
    window.setTimeout(() => {
      const latest = usePlayerStore.getState();
      if (latest.isPlaying && latest.currentTrack) {
        applyPlaybackIntent();
      }
    }, 150);
  }
}

function sessionActive() {
  return keepaliveTimer != null;
}

function startSessionKeepalive() {
  if (keepaliveTimer) return;

  keepaliveTimer = window.setInterval(() => {
    const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();

    if (!currentTrack) {
      teardownPlayerSession();
      return;
    }

    snapshotNow();

    if (!isPlaying || !isReady || !playerController.isReady()) return;

    const ytState = playerController.getPlayerState();
    if (
      ytState !== YT_PLAYER_STATE.PLAYING &&
      ytState !== YT_PLAYER_STATE.BUFFERING
    ) {
      setSuppressYtEvents(200);
      playerController.play();
      updateMediaSessionPlaybackState(true);
    }
  }, 500);
}

export function teardownPlayerSession() {
  if (keepaliveTimer) {
    window.clearInterval(keepaliveTimer);
    keepaliveTimer = null;
  }
  loadedVideoId = null;
  stopAudioKeepalive();
  void releaseWakeLock();
  releaseMediaSession();
}

export function initPlayerEngineSubscription() {
  return usePlayerStore.subscribe((state, prev) => {
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
}

/** Call on visibility / focus changes — works when React is throttled in background. */
export function handlePlaybackLifecycleEvent() {
  const { currentTrack, isPlaying } = usePlayerStore.getState();
  if (!currentTrack) return;

  if (document.visibilityState === "hidden" && isPlaying) {
    snapshotNow();
    applyPlaybackIntent();
    return;
  }

  if (document.visibilityState === "visible") {
    applyPlaybackIntent();
    void acquireWakeLock();
  }
}

export function initPlaybackLifecycleListeners() {
  const onLifecycle = () => handlePlaybackLifecycleEvent();

  document.addEventListener("visibilitychange", onLifecycle);
  window.addEventListener("focus", onLifecycle);
  window.addEventListener("pageshow", onLifecycle);

  return () => {
    document.removeEventListener("visibilitychange", onLifecycle);
    window.removeEventListener("focus", onLifecycle);
    window.removeEventListener("pageshow", onLifecycle);
  };
}
