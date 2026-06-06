"use client";

import { useEffect } from "react";

import { handleVisibilityChange } from "@/lib/player/background-playback";

/** Keep playback alive when the app is minimized or returns to the foreground. */
export function usePlaybackRecovery() {
  useEffect(() => {
    function onLifecycle() {
      handleVisibilityChange();
    }

    document.addEventListener("visibilitychange", onLifecycle);
    window.addEventListener("focus", onLifecycle);
    window.addEventListener("pageshow", onLifecycle);
    window.addEventListener("blur", onLifecycle);

    return () => {
      document.removeEventListener("visibilitychange", onLifecycle);
      window.removeEventListener("focus", onLifecycle);
      window.removeEventListener("pageshow", onLifecycle);
      window.removeEventListener("blur", onLifecycle);
    };
  }, []);
}
