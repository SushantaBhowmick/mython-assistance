"use client";

import { useEffect } from "react";

import { syncEngineToStore } from "@/lib/player/engine-sync";

/** Resume the YouTube engine when the app returns to the foreground. */
export function usePlaybackRecovery() {
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        syncEngineToStore();
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, []);
}
