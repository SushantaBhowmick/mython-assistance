"use client";

import { useEffect } from "react";

import { HiddenYouTubePlayer } from "@/components/player/HiddenYouTubePlayer";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import {
  engineNext,
  enginePauseStore,
  enginePlay,
  enginePrevious,
  engineResume,
} from "@/lib/player/engine-sync";
import { playerController } from "@/lib/player/player-controller";
import { usePlaybackRecovery } from "@/lib/player/use-playback-recovery";
import {
  registerMediaSessionActions,
  updateMediaSessionMetadata,
  updateMediaSessionPlaybackState,
  updateMediaSessionPositionState,
} from "@/lib/media-session";
import { usePlayerStore } from "@/store/player-store";

export function GlobalPlayerProvider({ children }: { children: React.ReactNode }) {
  usePlaybackRecovery();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const duration = usePlayerStore((s) => s.duration);
  const currentTime = usePlayerStore((s) => s.currentTime);

  useEffect(() => {
    registerMediaSessionActions({
      onPlay: () => engineResume(),
      onPause: () => enginePauseStore(),
      onPrevious: () => enginePrevious(),
      onNext: () => engineNext(),
      onSeekBackward: () => usePlayerStore.getState().skipBy(-10),
      onSeekForward: () => usePlayerStore.getState().skipBy(10),
      onSeekTo: (time) => usePlayerStore.getState().seekTo(time),
    });

    // Sync YouTube engine outside React — lock-screen controls work when the page is backgrounded.
    return usePlayerStore.subscribe((state, prev) => {
      if (!playerController.isReady() || !state.currentTrack) return;

      const videoChanged = state.currentTrack.videoId !== prev.currentTrack?.videoId;
      const started = state.isPlaying && !prev.isPlaying;
      const stopped = !state.isPlaying && prev.isPlaying;

      if (videoChanged && state.isPlaying) {
        enginePlay(
          state.currentTrack,
          state.lastKnownTime > 0 ? state.lastKnownTime : 0,
        );
      } else if (started) {
        playerController.play();
      } else if (stopped) {
        playerController.pause();
      }
    });
  }, []);

  useEffect(() => {
    updateMediaSessionMetadata(currentTrack);
  }, [currentTrack]);

  useEffect(() => {
    updateMediaSessionPlaybackState(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    updateMediaSessionPositionState(duration, currentTime);
  }, [duration, currentTime, isPlaying]);

  return (
    <>
      {children}
      <HiddenYouTubePlayer />
      <MiniPlayer />
    </>
  );
}
