/** Tiny silent loop — keeps the browser media session alive when backgrounded (Android PWA). */
let audioEl: HTMLAudioElement | null = null;

// Minimal valid WAV (44-byte header + silence)
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==";

export function startAudioKeepalive() {
  if (typeof window === "undefined") return;

  if (!audioEl) {
    audioEl = new Audio(SILENT_WAV);
    audioEl.loop = true;
    audioEl.volume = 0.001;
    audioEl.setAttribute("playsinline", "true");
  }

  void audioEl.play().catch(() => undefined);
}

export function stopAudioKeepalive() {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
}
