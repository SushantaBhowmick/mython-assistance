"use client";

import { useEffect } from "react";

import { HiddenYouTubePlayer } from "@/components/player/HiddenYouTubePlayer";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { registerMediaSessionActions } from "@/lib/media-session";
import {
  applyPlaybackIntent,
  forceEngineResume,
  initPlaybackLifecycleListeners,
  initPlayerEngineSubscription,
} from "@/lib/player/player-engine";
import { usePlayerStore } from "@/store/player-store";

function bindMediaSessionHandlers() {
  registerMediaSessionActions({
    onPlay: () => {
      usePlayerStore.getState().resume();
      forceEngineResume();
    },
    onPause: () => {
      usePlayerStore.getState().pause();
      applyPlaybackIntent();
    },
    onPrevious: () => {
      usePlayerStore.getState().previous();
      window.setTimeout(() => forceEngineResume(), 50);
    },
    onNext: () => {
      usePlayerStore.getState().next();
      window.setTimeout(() => forceEngineResume(), 50);
    },
    onSeekBackward: () => usePlayerStore.getState().skipBy(-10),
    onSeekForward: () => usePlayerStore.getState().skipBy(10),
    onSeekTo: (time) => usePlayerStore.getState().seekTo(time),
  });
}

export function GlobalPlayerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    bindMediaSessionHandlers();
    const unsubStore = initPlayerEngineSubscription();
    const unsubLifecycle = initPlaybackLifecycleListeners();

    return () => {
      unsubStore();
      unsubLifecycle();
    };
  }, []);

  return (
    <>
      {children}
      <HiddenYouTubePlayer />
      <MiniPlayer />
    </>
  );
}
