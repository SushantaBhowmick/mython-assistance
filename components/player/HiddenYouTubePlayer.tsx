"use client";

import { useEffect, useRef } from "react";

import { recordHistory } from "@/lib/music/api-client";
import { playerController } from "@/lib/player/player-controller";
import {
  loadYouTubeIframeApi,
  mapYtStateToPlayerState,
  YT_PLAYER_STATE,
  type YTPlayer,
} from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";

let playerInitPromise: Promise<void> | null = null;
let suppressYtEvents = false;

function setSuppressYtEvents(value: boolean, ms = 300) {
  suppressYtEvents = value;
  if (value) {
    window.setTimeout(() => {
      suppressYtEvents = false;
    }, ms);
  }
}

function ensureYouTubePlayer(container: HTMLElement): Promise<void> {
  if (playerInitPromise) return playerInitPromise;

  playerInitPromise = (async () => {
    await loadYouTubeIframeApi();
    if (!window.YT) return;

    if (playerController.isReady()) return;

    new window.YT.Player(container, {
      height: "0",
      width: "0",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: (event: { target: YTPlayer }) => {
          playerController.setInstance(event.target);
          usePlayerStore.getState().setReady(true);

          const store = usePlayerStore.getState();
          event.target.setVolume(store.volume);
          if (store.muted) event.target.mute();
        },
        onStateChange: (event: { data: number }) => {
          if (suppressYtEvents) return;

          const mapped = mapYtStateToPlayerState(event.data);
          usePlayerStore.getState().setPlayerState(mapped);

          if (event.data === YT_PLAYER_STATE.ENDED) {
            usePlayerStore.getState().next();
            return;
          }

          const store = usePlayerStore.getState();

          if (event.data === YT_PLAYER_STATE.PLAYING && !store.isPlaying) {
            usePlayerStore.setState({ isPlaying: true });
          }

          if (event.data === YT_PLAYER_STATE.PAUSED && store.isPlaying) {
            usePlayerStore.setState({ isPlaying: false });
          }
        },
      },
    });
  })();

  return playerInitPromise;
}

export function HiddenYouTubePlayer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  const lastRecordedRef = useRef<string | null>(null);
  const prevIsPlayingRef = useRef<boolean | null>(null);
  const initStartedRef = useRef(false);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isReady = usePlayerStore((s) => s.isReady);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);

  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || initStartedRef.current) return;

    initStartedRef.current = true;
    ensureYouTubePlayer(container).catch(() => {
      initStartedRef.current = false;
      playerInitPromise = null;
    });
  }, []);

  useEffect(() => {
    if (!isReady || !currentTrack) return;

    const videoId = currentTrack.videoId;
    const { lastKnownTime, isPlaying: shouldPlay } = usePlayerStore.getState();
    const startAt = lastKnownTime > 0 ? lastKnownTime : 0;

    if (loadedVideoIdRef.current === videoId) {
      if (shouldPlay) {
        setSuppressYtEvents(true, 400);
        playerController.play();
        prevIsPlayingRef.current = true;
      }
      return;
    }

    loadedVideoIdRef.current = videoId;
    lastRecordedRef.current = null;
    prevIsPlayingRef.current = null;

    setSuppressYtEvents(true, 800);

    if (shouldPlay) {
      playerController.loadVideo(videoId, startAt);
    } else {
      playerController.cueVideo(videoId, startAt);
      setCurrentTime(startAt);
    }
  }, [currentTrack, isReady, setCurrentTime]);

  useEffect(() => {
    if (!isReady || !currentTrack) return;
    if (loadedVideoIdRef.current !== currentTrack.videoId) return;
    if (prevIsPlayingRef.current === isPlaying) return;

    prevIsPlayingRef.current = isPlaying;
    setSuppressYtEvents(true, 400);

    if (isPlaying) {
      playerController.play();
    } else {
      playerController.pause();
    }
  }, [currentTrack?.videoId, isPlaying, isReady]);

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

      if (duration > 0) {
        store.setDuration(duration);
      }

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
    recordHistory({ track: currentTrack }).catch(() => {
      // History is best-effort.
    });
  }, [currentTrack, isPlaying]);

  return (
    <div
      className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-px w-px overflow-hidden opacity-0"
      aria-hidden
    >
      <div ref={mountRef} />
    </div>
  );
}
