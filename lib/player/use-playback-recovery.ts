"use client";

import { useEffect } from "react";

import { playerController } from "@/lib/player/player-controller";
import { usePlayerStore } from "@/store/player-store";

/** Resume playback when the app returns to the foreground. */
export function usePlaybackRecovery() {
  useEffect(() => {
    function tryResume() {
      const { isPlaying, currentTrack } = usePlayerStore.getState();
      if (!isPlaying || !currentTrack || !playerController.isReady()) return;

      const state = playerController.getPlayerState();
      // 1 = playing, 3 = buffering
      if (state !== 1 && state !== 3) {
        playerController.play();
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        tryResume();
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tryResume);
    window.addEventListener("pageshow", tryResume);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tryResume);
      window.removeEventListener("pageshow", tryResume);
    };
  }, []);
}
