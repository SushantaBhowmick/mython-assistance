"use client";

import { useEffect } from "react";

import { HiddenYouTubePlayer } from "@/components/player/HiddenYouTubePlayer";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import {
  registerMediaSessionActions,
  updateMediaSessionMetadata,
  updateMediaSessionPlaybackState,
  updateMediaSessionPositionState,
} from "@/lib/media-session";
import { applyPlaybackIntent, initPlayerEngineSubscription } from "@/lib/player/player-engine";
import { usePlayerStore } from "@/store/player-store";

function bindMediaSessionHandlers() {
  registerMediaSessionActions({
    onPlay: () => {
      usePlayerStore.getState().resume();
      applyPlaybackIntent();
    },
    onPause: () => {
      usePlayerStore.getState().pause();
      applyPlaybackIntent();
    },
    onPrevious: () => {
      usePlayerStore.getState().previous();
      applyPlaybackIntent();
    },
    onNext: () => {
      usePlayerStore.getState().next();
      applyPlaybackIntent();
    },
    onSeekBackward: () => usePlayerStore.getState().skipBy(-10),
    onSeekForward: () => usePlayerStore.getState().skipBy(10),
    onSeekTo: (time) => usePlayerStore.getState().seekTo(time),
  });
}

export function GlobalPlayerProvider({ children }: { children: React.ReactNode }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const duration = usePlayerStore((s) => s.duration);
  const currentTime = usePlayerStore((s) => s.currentTime);

  useEffect(() => {
    bindMediaSessionHandlers();
    return initPlayerEngineSubscription();
  }, []);

  useEffect(() => {
    if (!currentTrack) return;
    updateMediaSessionMetadata(currentTrack);
    bindMediaSessionHandlers();
    updateMediaSessionPlaybackState(isPlaying);
    updateMediaSessionPositionState(duration, currentTime);
  }, [currentTrack?.videoId, isPlaying, duration, currentTime]);

  return (
    <>
      {children}
      <HiddenYouTubePlayer />
      <MiniPlayer />
    </>
  );
}
