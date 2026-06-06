import {
  isBackgroundAudioActive,
  pauseBackgroundAudio,
  resumeBackgroundAudio,
} from "@/lib/player/background-audio-engine";
import { playerController } from "@/lib/player/player-controller";
import { YT_PLAYER_STATE } from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";
import type { MusicTrack } from "@/types/music";

let suppressYtEvents = false;

export function setSuppressYtEvents(ms = 400) {
  suppressYtEvents = true;
  window.setTimeout(() => {
    suppressYtEvents = false;
  }, ms);
}

export function isYtEventsSuppressed() {
  return suppressYtEvents;
}

/** Imperative sync — works when React effects are throttled in the background. */
export function syncEngineToStore() {
  const { currentTrack, isPlaying, isReady } = usePlayerStore.getState();
  if (!currentTrack || !isReady || !playerController.isReady()) return;

  if (isPlaying) {
    if (isBackgroundAudioActive()) {
      void resumeBackgroundAudio();
      return;
    }
    const ytState = playerController.getPlayerState();
    if (
      ytState === YT_PLAYER_STATE.PLAYING ||
      ytState === YT_PLAYER_STATE.BUFFERING
    ) {
      return;
    }
    setSuppressYtEvents(300);
    playerController.play();
  } else if (isBackgroundAudioActive()) {
    pauseBackgroundAudio();
  } else {
    playerController.pause();
  }
}

export function enginePlay(track?: MusicTrack | null, startAt = 0) {
  const resolved = track ?? usePlayerStore.getState().currentTrack;
  if (!resolved || !playerController.isReady()) return;

  setSuppressYtEvents(500);
  playerController.loadVideo(resolved.videoId, startAt);
  playerController.play();
}

export function enginePause() {
  if (isBackgroundAudioActive()) {
    pauseBackgroundAudio();
    return;
  }
  if (!playerController.isReady()) return;
  setSuppressYtEvents(200);
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
    if (isBackgroundAudioActive()) {
      void resumeBackgroundAudio();
      return;
    }
    enginePlay(currentTrack, lastKnownTime > 0 ? lastKnownTime : 0);
  }, 0);
}

export function enginePauseStore() {
  usePlayerStore.getState().pause();
  enginePause();
}
