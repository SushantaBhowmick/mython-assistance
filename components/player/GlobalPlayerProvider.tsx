"use client";

import { useEffect } from "react";

import { HiddenAudioPlayer } from "@/components/player/HiddenAudioPlayer";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import {
  registerMediaSessionActions,
  updateMediaSessionMetadata,
  updateMediaSessionPlaybackState,
  updateMediaSessionPositionState,
} from "@/lib/media-session";
import {
  onPlaybackStarted,
  onPlaybackStopped,
} from "@/lib/player/background-playback";
import {
  engineNext,
  enginePauseStore,
  enginePrevious,
  engineResume,
} from "@/lib/player/engine-sync";
import { playerController } from "@/lib/player/player-controller";
import { usePlaybackRecovery } from "@/lib/player/use-playback-recovery";
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

    // Imperative sync outside React — lock-screen controls work when the page is backgrounded.
    return usePlayerStore.subscribe((state, prev) => {
      if (!state.hasHydrated) return;
      if (!playerController.isReady() || !state.currentTrack) return;

      const started = state.isPlaying && !prev.isPlaying;
      const stopped = !state.isPlaying && prev.isPlaying;

      if (started) {
        playerController.play();
        onPlaybackStarted(state.currentTrack);
      } else if (stopped) {
        playerController.pause();
        onPlaybackStopped();
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
      <HiddenAudioPlayer />
      <MiniPlayer />
    </>
  );
}
