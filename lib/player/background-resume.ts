import { persistMediaSessionSnapshot } from "@/lib/media-session";
import { playerController } from "@/lib/player/player-controller";
import { YT_PLAYER_STATE } from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";

let stalledTicks = 0;

export function resetStalledTicks() {
  stalledTicks = 0;
}

function currentEngineTime() {
  if (!playerController.isReady()) {
    return usePlayerStore.getState().lastKnownTime;
  }

  const live = playerController.getCurrentTime();
  return Number.isFinite(live) && live > 0
    ? live
    : usePlayerStore.getState().lastKnownTime;
}

/** Reload the iframe at the current position after Android suspends it. */
export function forceBackgroundResume() {
  const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();
  if (!currentTrack || !isPlaying || !isReady || !playerController.isReady()) return;

  const startAt = currentEngineTime();
  playerController.loadVideo(currentTrack.videoId, startAt);
  playerController.play();
  stalledTicks = 0;

  const { duration, currentTime } = usePlayerStore.getState();
  persistMediaSessionSnapshot(currentTrack, true, duration, currentTime);
}

export function nudgeBackgroundPlayback() {
  if (!playerController.isReady()) return;

  const ytState = playerController.getPlayerState();
  if (ytState === YT_PLAYER_STATE.PLAYING || ytState === YT_PLAYER_STATE.BUFFERING) {
    stalledTicks = 0;
    return;
  }

  const hidden =
    typeof document !== "undefined" && document.visibilityState === "hidden";

  stalledTicks += 1;

  if (hidden && stalledTicks >= 2) {
    forceBackgroundResume();
    return;
  }

  playerController.play();
}
