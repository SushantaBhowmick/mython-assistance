"use client";

import { useEffect } from "react";

import { isAppInBackground } from "@/lib/player/background-playback";
import {
  updateMediaSessionPlaybackState,
} from "@/lib/media-session";
import { playerController } from "@/lib/player/player-controller";
import { YT_PLAYER_STATE } from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";

function nudgePlayback() {
  const { isPlaying, currentTrack } = usePlayerStore.getState();
  if (!isPlaying || !currentTrack || !playerController.isReady()) return;

  const state = playerController.getPlayerState();
  if (state !== YT_PLAYER_STATE.PLAYING && state !== YT_PLAYER_STATE.BUFFERING) {
    playerController.play();
  }

  updateMediaSessionPlaybackState(true);
}

/** Keep playback alive when backgrounded and recover when returning to the app. */
export function usePlaybackRecovery() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        nudgePlayback();
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", nudgePlayback);
    window.addEventListener("pageshow", nudgePlayback);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", nudgePlayback);
      window.removeEventListener("pageshow", nudgePlayback);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = window.setInterval(() => {
      if (!isAppInBackground()) return;
      nudgePlayback();
    }, 1500);

    return () => window.clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;

    async function acquire() {
      try {
        if (document.visibilityState === "visible") {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Unsupported or denied — non-fatal.
      }
    }

    void acquire();

    function onVisible() {
      if (
        document.visibilityState === "visible" &&
        usePlayerStore.getState().isPlaying &&
        !lock
      ) {
        void acquire();
      }
    }

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [isPlaying]);
}
