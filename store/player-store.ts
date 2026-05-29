import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { playerController } from "@/lib/player/player-controller";
import type { MusicTrack } from "@/types/music";

export type PlayerStateName =
  | "unstarted"
  | "ended"
  | "playing"
  | "paused"
  | "buffering"
  | "cued";

interface PlayerStoreState {
  currentTrack: MusicTrack | null;
  queue: MusicTrack[];
  currentIndex: number;
  isPlaying: boolean;
  isReady: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  muted: boolean;
  playerState: PlayerStateName;
  lastKnownTime: number;
  hasHydrated: boolean;
}

interface PlayerStoreActions {
  setTrack: (track: MusicTrack, queue?: MusicTrack[]) => void;
  playTrack: (track: MusicTrack, queue?: MusicTrack[], startAt?: number) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  skipBy: (deltaSeconds: number) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlayerState: (playerState: PlayerStateName) => void;
  setReady: (isReady: boolean) => void;
  setLastKnownTime: (time: number) => void;
  next: () => void;
  previous: () => void;
  setQueue: (queue: MusicTrack[]) => void;
  clearPlayer: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export type PlayerStore = PlayerStoreState & PlayerStoreActions;

const initialState: PlayerStoreState = {
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  isReady: false,
  duration: 0,
  currentTime: 0,
  volume: 100,
  muted: false,
  playerState: "unstarted",
  lastKnownTime: 0,
  hasHydrated: false,
};

function clampTime(seconds: number, duration: number) {
  if (duration > 0) {
    return Math.max(0, Math.min(seconds, duration));
  }
  return Math.max(0, seconds);
}

function resolveQueueIndex(queue: MusicTrack[], track: MusicTrack) {
  const index = queue.findIndex((item) => item.videoId === track.videoId);
  return index >= 0 ? index : 0;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTrack: (track, queue) => {
        const nextQueue = queue ?? get().queue;
        set({
          currentTrack: track,
          queue: nextQueue.length > 0 ? nextQueue : [track],
          currentIndex: resolveQueueIndex(
            nextQueue.length > 0 ? nextQueue : [track],
            track,
          ),
        });
      },

      playTrack: (track, queue, startAt = 0) => {
        const nextQueue = queue ?? get().queue;
        const resolvedQueue = nextQueue.length > 0 ? nextQueue : [track];

        set({
          currentTrack: track,
          queue: resolvedQueue,
          currentIndex: resolveQueueIndex(resolvedQueue, track),
          isPlaying: true,
          lastKnownTime: startAt,
          currentTime: startAt,
          duration: 0,
          playerState: "buffering",
        });
      },

      pause: () => {
        set({ isPlaying: false, playerState: "paused" });
      },

      resume: () => {
        if (!get().currentTrack) return;
        set({ isPlaying: true, playerState: "playing" });
      },

      togglePlay: () => {
        const { isPlaying } = get();
        if (isPlaying) {
          get().pause();
        } else {
          get().resume();
        }
      },

      seekTo: (seconds) => {
        const { duration } = get();
        const clamped = clampTime(seconds, duration);

        if (playerController.isReady()) {
          playerController.seekTo(clamped);
        }

        set({ currentTime: clamped, lastKnownTime: clamped });
      },

      skipBy: (deltaSeconds) => {
        const { currentTime, duration } = get();
        get().seekTo(currentTime + deltaSeconds);
        if (duration <= 0 && playerController.isReady()) {
          const liveTime = playerController.getCurrentTime();
          set({ currentTime: liveTime, lastKnownTime: liveTime });
        }
      },

      setDuration: (duration) => set({ duration }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setLastKnownTime: (lastKnownTime) => set({ lastKnownTime }),

      setVolume: (volume) => {
        const clamped = Math.max(0, Math.min(volume, 100));
        if (playerController.isReady()) {
          playerController.setVolume(clamped);
          if (clamped === 0) {
            playerController.mute();
          } else if (get().muted) {
            playerController.unMute();
          }
        }
        set({ volume: clamped, muted: clamped === 0 ? true : get().muted });
      },

      setMuted: (muted) => {
        if (playerController.isReady()) {
          if (muted) playerController.mute();
          else playerController.unMute();
        }
        set({ muted });
      },

      setPlayerState: (playerState) => set({ playerState }),
      setReady: (isReady) => set({ isReady }),

      next: () => {
        const { queue, currentIndex } = get();
        if (queue.length === 0) return;

        const nextIndex = (currentIndex + 1) % queue.length;
        get().playTrack(queue[nextIndex], queue, 0);
      },

      previous: () => {
        const { queue, currentIndex, currentTime } = get();

        if (queue.length === 0) return;

        if (currentTime > 3) {
          get().seekTo(0);
          return;
        }

        const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
        get().playTrack(queue[prevIndex], queue, 0);
      },

      setQueue: (queue) => set({ queue }),

      clearPlayer: () => {
        if (playerController.isReady()) {
          playerController.pause();
        }
        set({
          ...initialState,
          volume: get().volume,
          muted: get().muted,
          hasHydrated: true,
        });
      },

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "mython-player",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        currentIndex: state.currentIndex,
        volume: state.volume,
        muted: state.muted,
        lastKnownTime: state.lastKnownTime,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state) {
          state.isPlaying = false;
          state.isReady = false;
          state.currentTime = state.lastKnownTime;
          state.playerState = state.currentTrack ? "paused" : "unstarted";
        }
      },
    },
  ),
);
