import { YT_PLAYER_STATE } from "@/lib/player/youtube-types";

let audioEl: HTMLAudioElement | null = null;
let instanceReady = false;
let loadedVideoId: string | null = null;
let loadedSourceUrl: string | null = null;

function ensureElement() {
  if (typeof window === "undefined") return null;
  if (audioEl) return audioEl;

  audioEl = new Audio();
  audioEl.preload = "auto";
  audioEl.crossOrigin = "anonymous";
  audioEl.setAttribute("playsinline", "true");

  return audioEl;
}

export const playerController = {
  attachElement(element: HTMLAudioElement) {
    audioEl = element;
    instanceReady = true;
  },

  getInstance() {
    return audioEl;
  },

  isReady() {
    return audioEl != null && instanceReady;
  },

  getLoadedVideoId() {
    return loadedVideoId;
  },

  getLoadedSourceUrl() {
    return loadedSourceUrl;
  },

  play() {
    void audioEl?.play().catch(() => undefined);
  },

  pause() {
    audioEl?.pause();
  },

  stop() {
    if (!audioEl) return;
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.removeAttribute("src");
    audioEl.load();
    loadedVideoId = null;
    loadedSourceUrl = null;
  },

  loadSource(videoId: string, sourceUrl: string, startSeconds = 0) {
    const el = ensureElement();
    if (!el) return;

    loadedVideoId = videoId;
    loadedSourceUrl = sourceUrl;

    if (el.src !== sourceUrl) {
      el.src = sourceUrl;
      el.load();
    }

    const applyStart = () => {
      if (startSeconds > 0 && Number.isFinite(startSeconds)) {
        el.currentTime = startSeconds;
      }
    };

    if (el.readyState >= 1) {
      applyStart();
    } else {
      el.addEventListener("loadedmetadata", applyStart, { once: true });
    }
  },

  /** @deprecated Use loadSource — kept for engine-sync compatibility */
  loadVideo(videoId: string, startSeconds = 0) {
    if (!loadedSourceUrl || loadedVideoId !== videoId) return;
    if (startSeconds > 0) this.seekTo(startSeconds);
    this.play();
  },

  cueVideo(videoId: string, startSeconds = 0) {
    if (!loadedSourceUrl || loadedVideoId !== videoId) return;
    if (startSeconds > 0) this.seekTo(startSeconds);
    this.pause();
  },

  seekTo(seconds: number) {
    if (!audioEl || !Number.isFinite(seconds)) return;
    audioEl.currentTime = Math.max(0, seconds);
  },

  getCurrentTime() {
    return audioEl?.currentTime ?? 0;
  },

  getDuration() {
    const duration = audioEl?.duration ?? 0;
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  },

  getPlayerState() {
    if (!audioEl || !audioEl.src) return YT_PLAYER_STATE.UNSTARTED;
    if (audioEl.ended) return YT_PLAYER_STATE.ENDED;
    if (audioEl.paused) return YT_PLAYER_STATE.PAUSED;
    return YT_PLAYER_STATE.PLAYING;
  },

  setVolume(volume: number) {
    if (!audioEl) return;
    audioEl.volume = Math.max(0, Math.min(volume, 100)) / 100;
  },

  getVolume() {
    return Math.round((audioEl?.volume ?? 1) * 100);
  },

  mute() {
    if (audioEl) audioEl.muted = true;
  },

  unMute() {
    if (audioEl) audioEl.muted = false;
  },

  isMuted() {
    return audioEl?.muted ?? false;
  },

  destroy() {
    instanceReady = false;
    loadedVideoId = null;
    loadedSourceUrl = null;
    if (!audioEl) return;
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
    audioEl = null;
  },
};
