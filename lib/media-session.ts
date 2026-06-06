import type { MusicTrack } from "@/types/music";

type MediaSessionHandlers = {
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onSeekTo: (time: number) => void;
};

let handlers: MediaSessionHandlers | null = null;

export function isMediaSessionSupported() {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

export function registerMediaSessionActions(nextHandlers: MediaSessionHandlers) {
  if (!isMediaSessionSupported()) return;

  handlers = nextHandlers;

  try {
    navigator.mediaSession.setActionHandler("play", () => handlers?.onPlay());
    navigator.mediaSession.setActionHandler("pause", () => handlers?.onPause());
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      handlers?.onPrevious(),
    );
    navigator.mediaSession.setActionHandler("nexttrack", () => handlers?.onNext());
  } catch {
    // Some browsers reject handlers until media is playing.
  }
  navigator.mediaSession.setActionHandler("seekbackward", () =>
    handlers?.onSeekBackward(),
  );
  navigator.mediaSession.setActionHandler("seekforward", () =>
    handlers?.onSeekForward(),
  );
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime == null) return;
    handlers?.onSeekTo(details.seekTime);
  });
}

export function clearMediaSessionActions() {
  if (!isMediaSessionSupported()) return;

  const actions = [
    "play",
    "pause",
    "previoustrack",
    "nexttrack",
    "seekbackward",
    "seekforward",
    "seekto",
  ] as const;

  for (const action of actions) {
    try {
      navigator.mediaSession.setActionHandler(action, null);
    } catch {
      // Some browsers reject null handlers for unsupported actions.
    }
  }

  handlers = null;
}

export function updateMediaSessionMetadata(track: MusicTrack | null) {
  if (!isMediaSessionSupported()) return;

  if (!track) {
    navigator.mediaSession.metadata = null;
    return;
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.channelTitle,
    album: "YouTube",
    artwork: track.thumbnailUrl
      ? [
          { src: track.thumbnailUrl, sizes: "512x512", type: "image/jpeg" },
        ]
      : [],
  });
}

export function updateMediaSessionPlaybackState(isPlaying: boolean) {
  if (!isMediaSessionSupported()) return;
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
}

export function updateMediaSessionPositionState(
  duration: number,
  currentTime: number,
  playbackRate = 1,
) {
  if (!isMediaSessionSupported()) return;
  if (!Number.isFinite(duration) || duration <= 0) return;

  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate,
      position: Math.min(Math.max(currentTime, 0), duration),
    });
  } catch {
    // Some browsers reject invalid position state during track transitions.
  }
}
