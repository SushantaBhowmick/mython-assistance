import {
  updateMediaSessionPlaybackState,
} from "@/lib/media-session";
import { playerController } from "@/lib/player/player-controller";
import { YT_PLAYER_STATE } from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";

let loadedVideoId: string | null = null;
let suppressYtEvents = false;
let keepaliveTimer: number | null = null;

export function setSuppressYtEvents(ms = 400) {
  suppressYtEvents = true;
  window.setTimeout(() => {
    suppressYtEvents = false;
  }, ms);
}

export function shouldSuppressYtEvent() {
  return suppressYtEvents;
}

export function isDocumentHidden() {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

/** Single entry point — all play/pause/track changes go through here. */
export function applyPlaybackIntent() {
  const { currentTrack, isPlaying, lastKnownTime, isReady } = usePlayerStore.getState();
  if (!isReady || !currentTrack || !playerController.isReady()) return;

  if (!isPlaying) {
    stopBackgroundKeepalive();
    setSuppressYtEvents(200);
    playerController.pause();
    updateMediaSessionPlaybackState(false);
    return;
  }

  startBackgroundKeepalive();
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

  if (state === YT_PLAYER_STATE.ENDED) {
    usePlayerStore.getState().next();
    applyPlaybackIntent();
    return;
  }

  if (state === YT_PLAYER_STATE.PLAYING && !store.isPlaying) {
    usePlayerStore.setState({ isPlaying: true });
    updateMediaSessionPlaybackState(true);
    return;
  }

  if (state === YT_PLAYER_STATE.PAUSED && store.isPlaying) {
    // Android backgrounds the iframe — do NOT treat as user pause.
    if (isDocumentHidden()) {
      window.setTimeout(() => applyPlaybackIntent(), 50);
      return;
    }
    usePlayerStore.setState({ isPlaying: false });
    updateMediaSessionPlaybackState(false);
  }
}

function startBackgroundKeepalive() {
  if (keepaliveTimer) return;

  keepaliveTimer = window.setInterval(() => {
    const { isPlaying, currentTrack, isReady } = usePlayerStore.getState();
    if (!isPlaying || !currentTrack || !isReady || !playerController.isReady()) return;

    const ytState = playerController.getPlayerState();
    if (
      ytState !== YT_PLAYER_STATE.PLAYING &&
      ytState !== YT_PLAYER_STATE.BUFFERING
    ) {
      setSuppressYtEvents(200);
      playerController.play();
    }

    updateMediaSessionPlaybackState(true);
  }, 1200);
}

function stopBackgroundKeepalive() {
  if (!keepaliveTimer) return;
  window.clearInterval(keepaliveTimer);
  keepaliveTimer = null;
}

export function initPlayerEngineSubscription() {
  return usePlayerStore.subscribe((state, prev) => {
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
