"use client";

import { useEffect, useRef } from "react";

import { recordHistory } from "@/lib/music/api-client";
import { applyPlaybackIntent, handleYtStateChange } from "@/lib/player/player-engine";
import { playerController } from "@/lib/player/player-controller";
import {
  loadYouTubeIframeApi,
  mapYtStateToPlayerState,
  type YTPlayer,
} from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";

let playerInitPromise: Promise<void> | null = null;
let initGeneration = 0;

function ensureYouTubePlayer(container: HTMLElement, generation: number): Promise<void> {
  if (playerInitPromise) return playerInitPromise;

  playerInitPromise = (async () => {
    await loadYouTubeIframeApi();
    if (!window.YT || generation !== initGeneration) return;

    new window.YT.Player(container, {
      height: "200",
      width: "200",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        iv_load_policy: 3,
      },
      events: {
        onReady: (event: { target: YTPlayer }) => {
          if (generation !== initGeneration) {
            try {
              event.target.destroy();
            } catch {
              // ignore detached iframe
            }
            return;
          }

          playerController.setInstance(event.target);
          usePlayerStore.getState().setReady(true);

          const store = usePlayerStore.getState();
          event.target.setVolume(store.volume);
          if (store.muted) event.target.mute();

          applyPlaybackIntent();
        },
        onStateChange: (event: { data: number }) => {
          usePlayerStore.getState().setPlayerState(mapYtStateToPlayerState(event.data));
          handleYtStateChange(event.data);
        },
      },
    });
  })();

  return playerInitPromise;
}

export function HiddenYouTubePlayer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const lastRecordedRef = useRef<string | null>(null);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isReady = usePlayerStore((s) => s.isReady);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    initGeneration += 1;
    const generation = initGeneration;

    playerController.destroy();
    playerInitPromise = null;
    usePlayerStore.getState().setReady(false);

    ensureYouTubePlayer(container, generation).catch(() => {
      if (generation === initGeneration) {
        playerInitPromise = null;
      }
    });

    return () => {
      playerController.destroy();
      playerInitPromise = null;
      usePlayerStore.getState().setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (muted || volume === 0) {
      playerController.mute();
    } else {
      playerController.unMute();
      playerController.setVolume(volume);
    }
  }, [isReady, muted, volume]);

  useEffect(() => {
    if (!isReady) return;

    const interval = window.setInterval(() => {
      if (!playerController.isReady()) return;

      const duration = playerController.getDuration();
      const time = playerController.getCurrentTime();
      const store = usePlayerStore.getState();

      if (duration > 0) store.setDuration(duration);
      if (Number.isFinite(time) && time >= 0) {
        store.setCurrentTime(time);
        store.setLastKnownTime(time);
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [isReady]);

  useEffect(() => {
    if (!currentTrack || !isPlaying) return;
    if (lastRecordedRef.current === currentTrack.videoId) return;

    lastRecordedRef.current = currentTrack.videoId;
    recordHistory({ track: currentTrack }).catch(() => undefined);
  }, [currentTrack, isPlaying]);

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 z-0 h-[200px] w-[200px] overflow-hidden opacity-[0.001]"
      aria-hidden
    >
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}
