import { usePlayerStore } from "@/store/player-store";

let audioEl: HTMLAudioElement | null = null;
let active = false;
let loadToken = 0;

function playEndpoint(videoId: string) {
  return `${window.location.origin}/api/youtube/play?videoId=${encodeURIComponent(videoId)}`;
}

function ensureAudio() {
  if (audioEl) return audioEl;

  audioEl = new Audio();
  audioEl.preload = "auto";
  audioEl.setAttribute("playsinline", "true");

  audioEl.addEventListener("timeupdate", () => {
    if (!active || !audioEl) return;
    const time = audioEl.currentTime;
    if (!Number.isFinite(time) || time < 0) return;
    const store = usePlayerStore.getState();
    store.setCurrentTime(time);
    store.setLastKnownTime(time);
  });

  audioEl.addEventListener("ended", () => {
    if (!active) return;
    usePlayerStore.getState().next();
  });

  return audioEl;
}

function waitForCanPlay(el: HTMLAudioElement) {
  return new Promise<void>((resolve, reject) => {
    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      resolve();
      return;
    }

    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Background audio failed to load"));
    };
    const cleanup = () => {
      el.removeEventListener("canplay", onReady);
      el.removeEventListener("error", onError);
    };

    el.addEventListener("canplay", onReady);
    el.addEventListener("error", onError);
  });
}

export function isBackgroundAudioActive() {
  return active;
}

/** Warm the server-side stream cache while the iframe plays in the foreground. */
export function prefetchBackgroundStream(videoId: string) {
  if (typeof window === "undefined") return;
  void fetch(playEndpoint(videoId), { method: "HEAD", cache: "no-store" }).catch(() => undefined);
}

export async function startBackgroundAudio(videoId: string, startAt: number) {
  const token = ++loadToken;
  const el = ensureAudio();
  const src = playEndpoint(videoId);

  if (!el.src || !el.src.includes(videoId)) {
    el.src = src;
    el.load();
  }

  try {
    await waitForCanPlay(el);
    if (token !== loadToken) return false;

    if (startAt > 0 && Number.isFinite(startAt)) {
      el.currentTime = startAt;
    }

    await el.play();
    if (token !== loadToken) return false;

    active = true;
    return true;
  } catch {
    active = false;
    return false;
  }
}

export function stopBackgroundAudio() {
  const time = audioEl?.currentTime ?? usePlayerStore.getState().lastKnownTime;
  active = false;
  loadToken += 1;
  audioEl?.pause();
  return Number.isFinite(time) && time > 0 ? time : usePlayerStore.getState().lastKnownTime;
}

export function pauseBackgroundAudio() {
  audioEl?.pause();
}

export async function resumeBackgroundAudio() {
  if (!active || !audioEl) return false;
  try {
    await audioEl.play();
    return true;
  } catch {
    return false;
  }
}

export function seekBackgroundAudio(seconds: number) {
  if (!audioEl || !Number.isFinite(seconds)) return;
  audioEl.currentTime = Math.max(0, seconds);
}
