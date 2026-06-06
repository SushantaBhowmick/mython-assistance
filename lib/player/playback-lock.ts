/** Holds a Web Lock so Chromium is less likely to freeze the tab during playback. */
let releaseLock: (() => void) | null = null;
let holding = false;

export function acquirePlaybackLock() {
  if (typeof navigator === "undefined" || !navigator.locks || holding) return;

  holding = true;
  void navigator.locks.request(
    "mython-music-playback",
    { mode: "exclusive" },
    async () => {
      await new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
      holding = false;
    },
  );
}

export function releasePlaybackLock() {
  releaseLock?.();
  releaseLock = null;
  holding = false;
}
