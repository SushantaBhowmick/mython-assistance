import {
  holdMediaSession,
  persistMediaSessionSnapshot,
  releaseMediaSession,
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

export function isDocumentHidden() {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
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

  persistMediaSessionSnapshot(currentTrack, isPlaying, duration, currentTime);

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
    applyPlaybackIntent();
    return;
  }

  if (state === YT_PLAYER_STATE.PLAYING && !store.isPlaying) {
    usePlayerStore.setState({ isPlaying: true });
    persistMediaSessionSnapshot(
      store.currentTrack,
      true,
      store.duration,
      store.currentTime,
    );
    return;
  }

  if (state === YT_PLAYER_STATE.PAUSED && store.isPlaying) {
    // OS backgrounded the app — keep notification + user intent, retry playback.
    if (isDocumentHidden()) {
      persistMediaSessionSnapshot(
        store.currentTrack,
        true,
        store.duration,
        store.currentTime,
      );
      window.setTimeout(() => applyPlaybackIntent(), 50);
      return;
    }

    // Foreground: only accept pause if user tapped pause in the app/notification.
    // YouTube can spuriously pause during load — nudge resume once.
    persistMediaSessionSnapshot(
      store.currentTrack,
      true,
      store.duration,
      store.currentTime,
    );
    window.setTimeout(() => {
      const latest = usePlayerStore.getState();
      if (latest.isPlaying && latest.currentTrack) {
        applyPlaybackIntent();
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
    const { currentTrack, isPlaying, isReady, duration, currentTime } =
      usePlayerStore.getState();

    if (!currentTrack) {
      teardownPlayerSession();
      return;
    }

    persistMediaSessionSnapshot(currentTrack, isPlaying, duration, currentTime);

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
  }, 1000);
}

export function teardownPlayerSession() {
  if (keepaliveTimer) {
    window.clearInterval(keepaliveTimer);
    keepaliveTimer = null;
  }
  loadedVideoId = null;
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
