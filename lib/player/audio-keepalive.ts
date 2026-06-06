/** Silent loop — keeps Android from fully freezing the tab so YouTube can resume. */
let audioEl: HTMLAudioElement | null = null;
let shouldRun = false;

const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==";

function ensureAudio() {
  if (audioEl) return audioEl;

  audioEl = new Audio(SILENT_WAV);
  audioEl.loop = true;
  audioEl.volume = 0.001;
  audioEl.preload = "auto";
  audioEl.setAttribute("playsinline", "true");

  audioEl.addEventListener("pause", () => {
    if (shouldRun) {
      window.setTimeout(() => {
        if (shouldRun) void audioEl?.play().catch(() => undefined);
      }, 50);
    }
  });

  return audioEl;
}

export function startAudioKeepalive() {
  if (typeof window === "undefined") return;

  shouldRun = true;
  const el = ensureAudio();
  void el.play().catch(() => undefined);
}

export function stopAudioKeepalive() {
  shouldRun = false;
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
}
