"use client";

export function isAppInBackground() {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

/** Ignore YouTube pause events fired when the OS backgrounds the PWA. */
export function shouldIgnoreBackgroundPause(isPlaying: boolean, ytState: number) {
  // 2 = paused
  return isPlaying && ytState === 2 && isAppInBackground();
}
