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
let sessionHeld = false;

export function isMediaSessionSupported() {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

export function isMediaSessionHeld() {
  return sessionHeld;
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
  } catch {
    // Some browsers reject handlers until media is playing.
  }
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

/** Lock the system media notification until the user closes the player. */
export function holdMediaSession(track: MusicTrack) {
  if (!isMediaSessionSupported()) return;

  sessionHeld = true;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.channelTitle,
    album: "Mython",
    artwork: track.thumbnailUrl
      ? [
          { src: track.thumbnailUrl, sizes: "96x96", type: "image/jpeg" },
          { src: track.thumbnailUrl, sizes: "512x512", type: "image/jpeg" },
        ]
      : [],
  });
  navigator.mediaSession.playbackState = "playing";
}

/** Only called when user closes the player — clears the notification bar. */
export function releaseMediaSession() {
  if (!isMediaSessionSupported()) return;

  sessionHeld = false;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.playbackState = "none";
  // Keep action handlers registered so the next track can use lock-screen controls immediately.
}

export function updateMediaSessionMetadata(track: MusicTrack | null) {
  if (!isMediaSessionSupported()) return;
  if (!track) return;
  if (!sessionHeld) holdMediaSession(track);
  else {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.channelTitle,
      album: "Mython",
      artwork: track.thumbnailUrl
        ? [
            { src: track.thumbnailUrl, sizes: "96x96", type: "image/jpeg" },
            { src: track.thumbnailUrl, sizes: "512x512", type: "image/jpeg" },
          ]
        : [],
    });
  }
}

export function updateMediaSessionPlaybackState(isPlaying: boolean) {
  if (!isMediaSessionSupported() || !sessionHeld) return;
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
}

export function updateMediaSessionPositionState(
  duration: number,
  currentTime: number,
  playbackRate = 1,
) {
  if (!isMediaSessionSupported() || !sessionHeld) return;
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

/** Re-assert notification content so Android does not dismiss it in background. */
export function persistMediaSessionSnapshot(
  track: MusicTrack | null,
  isPlaying: boolean,
  duration: number,
  currentTime: number,
) {
  if (!track || !sessionHeld) return;

  updateMediaSessionMetadata(track);
  updateMediaSessionPlaybackState(isPlaying);
  updateMediaSessionPositionState(duration, currentTime);
}
