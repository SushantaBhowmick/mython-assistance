"use client";

import { useEffect } from "react";

import { HiddenYouTubePlayer } from "@/components/player/HiddenYouTubePlayer";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import {
  clearMediaSessionActions,
  registerMediaSessionActions,
  updateMediaSessionMetadata,
  updateMediaSessionPlaybackState,
  updateMediaSessionPositionState,
} from "@/lib/media-session";
import { usePlayerStore } from "@/store/player-store";

export function GlobalPlayerProvider({ children }: { children: React.ReactNode }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const duration = usePlayerStore((s) => s.duration);
  const currentTime = usePlayerStore((s) => s.currentTime);

  useEffect(() => {
    registerMediaSessionActions({
      onPlay: () => usePlayerStore.getState().resume(),
      onPause: () => usePlayerStore.getState().pause(),
      onPrevious: () => usePlayerStore.getState().previous(),
      onNext: () => usePlayerStore.getState().next(),
      onSeekBackward: () => usePlayerStore.getState().skipBy(-10),
      onSeekForward: () => usePlayerStore.getState().skipBy(10),
      onSeekTo: (time) => usePlayerStore.getState().seekTo(time),
    });

    return () => clearMediaSessionActions();
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
