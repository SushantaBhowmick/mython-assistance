"use client";

import { useEffect, useRef } from "react";

import { recordHistory } from "@/lib/music/api-client";
import {
  isBackgroundAudioActive,
  startBackgroundAudio,
  resumeBackgroundAudio,
} from "@/lib/player/background-audio-engine";
import {
  forceBackgroundResume,
  getLoadedVideoId,
  onPlaybackStarted,
  onPlaybackStopped,
  setLoadedVideoId,
  snapshotMediaSession,
} from "@/lib/player/background-playback";
import { enginePlay, isYtEventsSuppressed, setSuppressYtEvents } from "@/lib/player/engine-sync";
import { playerController } from "@/lib/player/player-controller";
import {
  loadYouTubeIframeApi,
  mapYtStateToPlayerState,
  YT_PLAYER_STATE,
  type YTPlayer,
} from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";

let playerInitPromise: Promise<void> | null = null;

function ensureYouTubePlayer(container: HTMLElement): Promise<void> {
  if (playerInitPromise) return playerInitPromise;

  playerInitPromise = (async () => {
    await loadYouTubeIframeApi();
    if (!window.YT) return;
    if (playerController.isReady()) return;

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
          playerController.setInstance(event.target);
          usePlayerStore.getState().setReady(true);

          const store = usePlayerStore.getState();
          event.target.setVolume(store.volume);
          if (store.muted) event.target.mute();

          if (store.currentTrack && store.isPlaying) {
            enginePlay(store.currentTrack, store.lastKnownTime);
            onPlaybackStarted(store.currentTrack);
            setLoadedVideoId(store.currentTrack.videoId);
          }
        },
        onStateChange: (event: { data: number }) => {
          if (isYtEventsSuppressed()) return;

          const mapped = mapYtStateToPlayerState(event.data);
          usePlayerStore.getState().setPlayerState(mapped);

          if (event.data === YT_PLAYER_STATE.ENDED) {
            usePlayerStore.getState().next();
            window.setTimeout(() => {
              const { currentTrack, isPlaying } = usePlayerStore.getState();
              if (currentTrack && isPlaying) {
                enginePlay(currentTrack, 0);
                setLoadedVideoId(currentTrack.videoId);
              }
            }, 0);
            return;
          }

          const store = usePlayerStore.getState();

          if (event.data === YT_PLAYER_STATE.PLAYING) {
            if (!store.isPlaying) {
              usePlayerStore.setState({ isPlaying: true });
            }
            snapshotMediaSession();
            return;
          }

          if (event.data === YT_PLAYER_STATE.PAUSED && store.isPlaying) {
            if (document.visibilityState === "hidden") {
              snapshotMediaSession();
              void (async () => {
                if (isBackgroundAudioActive()) {
                  await resumeBackgroundAudio();
                  return;
                }
                const track = store.currentTrack;
                if (!track) return;
                const ok = await startBackgroundAudio(track.videoId, store.lastKnownTime);
                if (!ok) {
                  forceBackgroundResume();
                  window.setTimeout(() => forceBackgroundResume(), 300);
                }
              })();
              return;
            }

            snapshotMediaSession();
            setSuppressYtEvents(250);
            playerController.play();
          }
        },
      },
    });
  })();

  return playerInitPromise;
}

export function HiddenYouTubePlayer() {
  const mountRef = useRef<HTMLDivElement>(null);
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

    if (getLoadedVideoId() === videoId) {
      if (shouldPlay) {
        setSuppressYtEvents(400);
        playerController.play();
        onPlaybackStarted(currentTrack);
        prevIsPlayingRef.current = true;
      }
      return;
    }

    setLoadedVideoId(videoId);
    lastRecordedRef.current = null;
    prevIsPlayingRef.current = null;

    setSuppressYtEvents(800);

    if (shouldPlay) {
      playerController.loadVideo(videoId, startAt);
      onPlaybackStarted(currentTrack);
    } else {
      playerController.cueVideo(videoId, startAt);
      setCurrentTime(startAt);
      onPlaybackStopped();
    }
  }, [currentTrack, isReady, setCurrentTime]);

  useEffect(() => {
    if (!isReady || !currentTrack) return;
    if (isBackgroundAudioActive()) return;
    if (getLoadedVideoId() !== currentTrack.videoId) return;
    if (prevIsPlayingRef.current === isPlaying) return;

    prevIsPlayingRef.current = isPlaying;
    setSuppressYtEvents(400);

    if (isPlaying) {
      playerController.play();
      onPlaybackStarted(currentTrack);
    } else {
      playerController.pause();
      onPlaybackStopped();
    }
  }, [currentTrack?.videoId, isPlaying, isReady, currentTrack]);

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
