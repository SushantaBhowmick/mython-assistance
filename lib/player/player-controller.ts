import type { YTPlayer } from "@/lib/player/youtube-types";

let playerInstance: YTPlayer | null = null;
let instanceReady = false;

export const playerController = {
  setInstance(player: YTPlayer | null) {
    playerInstance = player;
    instanceReady = player != null;
  },

  getInstance() {
    return playerInstance;
  },

  isReady() {
    return playerInstance != null && instanceReady;
  },

  play() {
    playerInstance?.playVideo();
  },

  pause() {
    playerInstance?.pauseVideo();
  },

  stop() {
    playerInstance?.stopVideo();
  },

  loadVideo(videoId: string, startSeconds = 0) {
    playerInstance?.loadVideoById({ videoId, startSeconds });
  },

  cueVideo(videoId: string, startSeconds = 0) {
    playerInstance?.cueVideoById({ videoId, startSeconds });
  },

  seekTo(seconds: number) {
    playerInstance?.seekTo(seconds, true);
  },

  getCurrentTime() {
    return playerInstance?.getCurrentTime() ?? 0;
  },

  getDuration() {
    const duration = playerInstance?.getDuration() ?? 0;
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  },

  getPlayerState() {
    return playerInstance?.getPlayerState() ?? -1;
  },

  setVolume(volume: number) {
    playerInstance?.setVolume(volume);
  },

  getVolume() {
    return playerInstance?.getVolume() ?? 100;
  },

  mute() {
    playerInstance?.mute();
  },

  unMute() {
    playerInstance?.unMute();
  },

  isMuted() {
    return playerInstance?.isMuted() ?? false;
  },

  destroy() {
    instanceReady = false;
    try {
      playerInstance?.destroy();
    } catch {
      // iframe may already be detached after navigation or HMR
    }
    playerInstance = null;
  },
};
