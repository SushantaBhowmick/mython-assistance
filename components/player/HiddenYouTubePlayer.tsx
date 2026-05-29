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

export function HiddenYouTubePlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  const suppressYtEventsRef = useRef(false);
  const lastRecordedRef = useRef<string | null>(null);
  const prevIsPlayingRef = useRef<boolean | null>(null);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isReady = usePlayerStore((s) => s.isReady);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);

  const setReady = usePlayerStore((s) => s.setReady);
  const setPlayerState = usePlayerStore((s) => s.setPlayerState);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setLastKnownTime = usePlayerStore((s) => s.setLastKnownTime);
  const next = usePlayerStore((s) => s.next);

  useEffect(() => {
    let cancelled = false;

    async function initPlayer() {
      await loadYouTubeIframeApi();
      if (cancelled || !containerRef.current || !window.YT) return;

      const player = new window.YT.Player(containerRef.current, {
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
            setReady(true);

            const store = usePlayerStore.getState();
            event.target.setVolume(store.volume);
            if (store.muted) event.target.mute();

            if (store.currentTrack) {
              const startAt = store.lastKnownTime;
              suppressYtEventsRef.current = true;
              event.target.cueVideoById({
                videoId: store.currentTrack.videoId,
                startSeconds: startAt,
              });
              loadedVideoIdRef.current = store.currentTrack.videoId;
              setCurrentTime(startAt);
              setPlayerState("cued");

              window.setTimeout(() => {
                suppressYtEventsRef.current = false;
              }, 300);
            }
          },
          onStateChange: (event: { data: number }) => {
            if (suppressYtEventsRef.current) return;

            const mapped = mapYtStateToPlayerState(event.data);
            setPlayerState(mapped);

            if (event.data === YT_PLAYER_STATE.ENDED) {
              next();
              return;
            }

            const store = usePlayerStore.getState();

            if (
              event.data === YT_PLAYER_STATE.PLAYING &&
              !store.isPlaying
            ) {
              usePlayerStore.setState({ isPlaying: true });
            }

            if (
              event.data === YT_PLAYER_STATE.PAUSED &&
              store.isPlaying
            ) {
              usePlayerStore.setState({ isPlaying: false });
            }
          },
        },
      });

      void player;
    }

    initPlayer();

    return () => {
      cancelled = true;
      playerController.destroy();
      loadedVideoIdRef.current = null;
      setReady(false);
    };
  }, [next, setCurrentTime, setPlayerState, setReady]);

  useEffect(() => {
    if (!isReady || !currentTrack) return;

    const videoId = currentTrack.videoId;
    if (loadedVideoIdRef.current === videoId) return;

    loadedVideoIdRef.current = videoId;
    lastRecordedRef.current = null;
    prevIsPlayingRef.current = null;

    const { lastKnownTime, isPlaying: shouldPlay } = usePlayerStore.getState();
    const startAt = lastKnownTime > 0 ? lastKnownTime : 0;

    suppressYtEventsRef.current = true;

    if (shouldPlay) {
      playerController.loadVideo(videoId, startAt);
    } else {
      playerController.cueVideo(videoId, startAt);
      setCurrentTime(startAt);
    }

    window.setTimeout(() => {
      suppressYtEventsRef.current = false;
    }, 300);
  }, [currentTrack, isReady, setCurrentTime]);

  useEffect(() => {
    if (!isReady || !currentTrack) return;
    if (loadedVideoIdRef.current !== currentTrack.videoId) return;
    if (prevIsPlayingRef.current === isPlaying) return;

    prevIsPlayingRef.current = isPlaying;
    suppressYtEventsRef.current = true;

    if (isPlaying) {
      playerController.play();
    } else {
      playerController.pause();
    }

    window.setTimeout(() => {
      suppressYtEventsRef.current = false;
    }, 150);
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
      const duration = playerController.getDuration();
      const time = playerController.getCurrentTime();

      if (duration > 0) {
        setDuration(duration);
      }

      if (Number.isFinite(time) && time >= 0) {
        setCurrentTime(time);
        setLastKnownTime(time);
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [isReady, setCurrentTime, setDuration, setLastKnownTime]);

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
      ref={containerRef}
      className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-px w-px opacity-0"
      aria-hidden
    />
  );
}
