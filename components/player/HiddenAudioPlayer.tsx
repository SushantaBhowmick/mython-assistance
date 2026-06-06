"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { fetchStreamUrl, recordHistory } from "@/lib/music/api-client";
import {
  getLoadedVideoId,
  onPlaybackStarted,
  onPlaybackStopped,
  resetLoadedVideo,
  setLoadedVideoId,
  snapshotMediaSession,
} from "@/lib/player/background-playback";
import { setSuppressYtEvents } from "@/lib/player/engine-sync";
import { playerController } from "@/lib/player/player-controller";
import { YT_PLAYER_STATE } from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";

export function HiddenAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastRecordedRef = useRef<string | null>(null);
  const prevIsPlayingRef = useRef<boolean | null>(null);
  const loadTokenRef = useRef(0);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const hasHydrated = usePlayerStore((s) => s.hasHydrated);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);

  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setReady = usePlayerStore((s) => s.setReady);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    playerController.attachElement(audio);
    setReady(true);

    const onTimeUpdate = () => {
      const time = audio.currentTime;
      if (!Number.isFinite(time) || time < 0) return;
      const store = usePlayerStore.getState();
      store.setCurrentTime(time);
      store.setLastKnownTime(time);
    };

    const onLoadedMetadata = () => {
      const duration = audio.duration;
      if (Number.isFinite(duration) && duration > 0) {
        usePlayerStore.getState().setDuration(duration);
      }
    };

    const onEnded = () => {
      usePlayerStore.getState().next();
    };

    const onPause = () => {
      const store = usePlayerStore.getState();
      if (!store.isPlaying || !store.currentTrack) return;

      // Spotify-style: keep playing in background when the OS tries to pause the element.
      if (document.visibilityState === "hidden") {
        window.setTimeout(() => {
          const latest = usePlayerStore.getState();
          if (latest.isPlaying && latest.currentTrack) {
            playerController.play();
          }
        }, 120);
      }
    };

    const onError = async () => {
      const store = usePlayerStore.getState();
      if (!store.currentTrack || !store.isPlaying) return;

      try {
        const { url } = await fetchStreamUrl(store.currentTrack.videoId);
        playerController.loadSource(store.currentTrack.videoId, url, store.lastKnownTime);
        playerController.play();
      } catch {
        toast.error("Playback interrupted — tap play to resume");
        store.pause();
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [setReady]);

  useEffect(() => {
    if (!hasHydrated || !currentTrack) return;

    const videoId = currentTrack.videoId;
    const token = ++loadTokenRef.current;

    async function loadTrack() {
      const track = usePlayerStore.getState().currentTrack;
      if (!track || track.videoId !== videoId) return;

      const { lastKnownTime, isPlaying: shouldPlay } = usePlayerStore.getState();
      const startAt = lastKnownTime > 0 ? lastKnownTime : 0;

      if (getLoadedVideoId() === videoId && playerController.getLoadedSourceUrl()) {
        if (shouldPlay) {
          setSuppressYtEvents(300);
          playerController.play();
          onPlaybackStarted(track);
          prevIsPlayingRef.current = true;
        }
        return;
      }

      try {
        const { url } = await fetchStreamUrl(videoId);
        if (token !== loadTokenRef.current) return;

        setLoadedVideoId(videoId);
        lastRecordedRef.current = null;
        prevIsPlayingRef.current = null;
        setSuppressYtEvents(500);

        playerController.loadSource(videoId, url, startAt);

        if (shouldPlay) {
          playerController.play();
          onPlaybackStarted(track);
        } else {
          playerController.pause();
          setCurrentTime(startAt);
          onPlaybackStopped();
        }
      } catch {
        if (token !== loadTokenRef.current) return;
        toast.error("Could not load audio for this track");
        usePlayerStore.getState().pause();
        resetLoadedVideo();
      }
    }

    void loadTrack();
  }, [currentTrack, hasHydrated, setCurrentTime]);

  useEffect(() => {
    if (!currentTrack || !hasHydrated) return;
    if (getLoadedVideoId() !== currentTrack.videoId) return;
    if (prevIsPlayingRef.current === isPlaying) return;

    prevIsPlayingRef.current = isPlaying;
    setSuppressYtEvents(300);

    if (isPlaying) {
      playerController.play();
      onPlaybackStarted(currentTrack);
    } else {
      playerController.pause();
      onPlaybackStopped();
    }
  }, [currentTrack?.videoId, isPlaying, hasHydrated, currentTrack]);

  useEffect(() => {
    if (muted || volume === 0) {
      playerController.mute();
    } else {
      playerController.unMute();
      playerController.setVolume(volume);
    }
  }, [muted, volume]);

  useEffect(() => {
    if (!currentTrack || !isPlaying) return;
    if (lastRecordedRef.current === currentTrack.videoId) return;

    lastRecordedRef.current = currentTrack.videoId;
    recordHistory({ track: currentTrack }).catch(() => undefined);
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!playerController.isReady()) return;
      const state = playerController.getPlayerState();
      if (state === YT_PLAYER_STATE.PLAYING) {
        snapshotMediaSession();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <audio
      ref={audioRef}
      className="hidden"
      preload="auto"
      playsInline
      aria-hidden
    />
  );
}
