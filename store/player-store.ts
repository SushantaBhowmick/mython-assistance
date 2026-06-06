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
  originalQueue: MusicTrack[];
  currentIndex: number;
  shuffleEnabled: boolean;
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
  /** User tapped a track row — always start/resume playback, never pause. */
  selectTrack: (track: MusicTrack, queue?: MusicTrack[]) => void;
  playShuffledQueue: (tracks: MusicTrack[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
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
  originalQueue: [],
  currentIndex: -1,
  shuffleEnabled: false,
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

export function shuffleQueueItems(
  queue: MusicTrack[],
  currentTrack?: MusicTrack | null,
): MusicTrack[] {
  if (queue.length <= 1) return [...queue];

  const copy = [...queue];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  if (
    currentTrack &&
    copy.length > 1 &&
    copy[0]?.videoId === currentTrack.videoId
  ) {
    [copy[0], copy[1]] = [copy[1], copy[0]];
  }

  return copy;
}

function buildQueueState(
  track: MusicTrack,
  queue: MusicTrack[],
  shuffleEnabled: boolean,
) {
  const resolvedQueue = queue.length > 0 ? queue : [track];

  if (shuffleEnabled && resolvedQueue.length > 1) {
    const shuffled = shuffleQueueItems(resolvedQueue, track);
    return {
      queue: shuffled,
      originalQueue: resolvedQueue,
      currentIndex: resolveQueueIndex(shuffled, track),
    };
  }

  return {
    queue: resolvedQueue,
    originalQueue: shuffleEnabled ? resolvedQueue : [],
    currentIndex: resolveQueueIndex(resolvedQueue, track),
  };
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTrack: (track, queue) => {
        const nextQueue = queue ?? get().queue;
        const queueState = buildQueueState(
          track,
          nextQueue.length > 0 ? nextQueue : [track],
          get().shuffleEnabled,
        );

        set({
          currentTrack: track,
          ...queueState,
        });
      },

      playTrack: (track, queue, startAt = 0) => {
        const nextQueue = queue ?? get().queue;
        const queueState = buildQueueState(track, nextQueue, get().shuffleEnabled);

        set({
          currentTrack: track,
          ...queueState,
          isPlaying: true,
          lastKnownTime: startAt,
          currentTime: startAt,
          duration: 0,
          playerState: "buffering",
        });
      },

      selectTrack: (track, queue) => {
        const { currentTrack, lastKnownTime } = get();
        if (currentTrack?.videoId === track.videoId) {
          get().resume();
          if (playerController.isReady()) {
            const startAt = lastKnownTime > 0 ? lastKnownTime : 0;
            playerController.loadVideo(track.videoId, startAt);
            playerController.play();
          }
          return;
        }

        get().playTrack(track, queue ?? [track], 0);
      },

      playShuffledQueue: (tracks) => {
        if (tracks.length === 0) return;

        const shuffled = shuffleQueueItems(tracks);
        set({
          shuffleEnabled: true,
          originalQueue: tracks,
          queue: shuffled,
          currentTrack: shuffled[0],
          currentIndex: 0,
          isPlaying: true,
          lastKnownTime: 0,
          currentTime: 0,
          duration: 0,
          playerState: "buffering",
        });
      },

      toggleShuffle: () => {
        const { shuffleEnabled, queue, originalQueue, currentTrack, currentIndex } =
          get();

        if (shuffleEnabled) {
          const base = originalQueue.length > 0 ? originalQueue : queue;
          const index = currentTrack
            ? base.findIndex((item) => item.videoId === currentTrack.videoId)
            : currentIndex;

          set({
            shuffleEnabled: false,
            queue: base,
            originalQueue: [],
            currentIndex: index >= 0 ? index : 0,
          });
          return;
        }

        const base = queue.length > 0 ? queue : [];
        if (base.length <= 1) {
          set({ shuffleEnabled: true, originalQueue: base });
          return;
        }

        const shuffled = shuffleQueueItems(base, currentTrack);
        const index = currentTrack
          ? shuffled.findIndex((item) => item.videoId === currentTrack.videoId)
          : currentIndex;

        set({
          shuffleEnabled: true,
          originalQueue: base,
          queue: shuffled,
          currentIndex: index >= 0 ? index : 0,
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

      setQueue: (queue) => {
        const { shuffleEnabled, currentTrack } = get();
        if (shuffleEnabled && queue.length > 1) {
          const shuffled = shuffleQueueItems(queue, currentTrack);
          set({
            queue: shuffled,
            originalQueue: queue,
            currentIndex: currentTrack
              ? resolveQueueIndex(shuffled, currentTrack)
              : get().currentIndex,
          });
          return;
        }

        set({ queue, originalQueue: shuffleEnabled ? queue : [] });
      },

      clearPlayer: () => {
        if (playerController.isReady()) {
          playerController.stop();
        }
        set({
          ...initialState,
          volume: get().volume,
          muted: get().muted,
          shuffleEnabled: get().shuffleEnabled,
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
        originalQueue: state.originalQueue,
        currentIndex: state.currentIndex,
        shuffleEnabled: state.shuffleEnabled,
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
