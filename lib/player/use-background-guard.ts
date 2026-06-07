"use client";

import { useEffect } from "react";

import {
  holdMediaSession,
  persistMediaSessionSnapshot,
} from "@/lib/media-session";
import { startAudioKeepalive, stopAudioKeepalive } from "@/lib/player/audio-keepalive";
import {
  forceBackgroundResume,
  nudgeBackgroundPlayback,
  resetStalledTicks,
} from "@/lib/player/background-resume";
import { usePlayerStore } from "@/store/player-store";

export function useBackgroundGuard() {
  useEffect(() => {
    let nudgeTimer: number | null = null;

    function clearNudge() {
      if (nudgeTimer == null) return;
      window.clearInterval(nudgeTimer);
      nudgeTimer = null;
    }

    function startNudge(intervalMs: number) {
      clearNudge();
      nudgeTimer = window.setInterval(() => {
        const { isPlaying, currentTrack, duration, currentTime } =
          usePlayerStore.getState();
        if (!isPlaying || !currentTrack) return;

        nudgeBackgroundPlayback();
        persistMediaSessionSnapshot(currentTrack, true, duration, currentTime);
      }, intervalMs);
    }

    function onPlaybackStarted() {
      const { currentTrack } = usePlayerStore.getState();
      if (!currentTrack) return;

      resetStalledTicks();
      holdMediaSession(currentTrack);
      startAudioKeepalive();
    }

    function onPlaybackStopped() {
      stopAudioKeepalive();
      clearNudge();
      resetStalledTicks();
    }

    function onLifecycle() {
      const { isPlaying, currentTrack } = usePlayerStore.getState();
      if (!isPlaying || !currentTrack) {
        onPlaybackStopped();
        return;
      }

      if (document.visibilityState === "hidden") {
        holdMediaSession(currentTrack);
        startAudioKeepalive();
        forceBackgroundResume();
        startNudge(250);
        return;
      }

      startNudge(500);
    }

    const unsubscribe = usePlayerStore.subscribe((state, prev) => {
      if (state.isPlaying && state.currentTrack && !prev.isPlaying) {
        onPlaybackStarted();
      }

      if (!state.isPlaying && prev.isPlaying) {
        onPlaybackStopped();
      }
    });

    document.addEventListener("visibilitychange", onLifecycle);
    window.addEventListener("pagehide", onLifecycle);
    window.addEventListener("pageshow", onLifecycle);

    const initial = usePlayerStore.getState();
    if (initial.isPlaying && initial.currentTrack) {
      onPlaybackStarted();
      if (document.visibilityState === "hidden") {
        onLifecycle();
      } else {
        startNudge(500);
      }
    }

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onLifecycle);
      window.removeEventListener("pagehide", onLifecycle);
      window.removeEventListener("pageshow", onLifecycle);
      onPlaybackStopped();
    };
  }, []);
}
