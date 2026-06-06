import { playerController } from "@/lib/player/player-controller";
import { usePlayerStore } from "@/store/player-store";
import type { MusicTrack } from "@/types/music";

/** Imperative sync — required for lock-screen controls when React effects are throttled in background. */
export function syncEngineToStore() {
  const { currentTrack, isPlaying, lastKnownTime } = usePlayerStore.getState();
  if (!currentTrack || !playerController.isReady()) return;

  if (isPlaying) {
    enginePlay(currentTrack, lastKnownTime > 0 ? lastKnownTime : 0);
  } else {
    playerController.pause();
  }
}

export function enginePlay(track?: MusicTrack | null, startAt = 0) {
  const resolved = track ?? usePlayerStore.getState().currentTrack;
  if (!resolved || !playerController.isReady()) return;

  playerController.loadVideo(resolved.videoId, startAt);
  playerController.play();
}

export function enginePause() {
  if (!playerController.isReady()) return;
  playerController.pause();
}

export function engineNext() {
  usePlayerStore.getState().next();
  window.setTimeout(() => syncEngineToStore(), 0);
}

export function enginePrevious() {
  usePlayerStore.getState().previous();
  window.setTimeout(() => syncEngineToStore(), 0);
}

export function engineResume() {
  usePlayerStore.getState().resume();
  window.setTimeout(() => {
    const { currentTrack, lastKnownTime } = usePlayerStore.getState();
    if (!currentTrack) return;
    enginePlay(currentTrack, lastKnownTime > 0 ? lastKnownTime : 0);
  }, 0);
}

export function enginePauseStore() {
  usePlayerStore.getState().pause();
  enginePause();
}
