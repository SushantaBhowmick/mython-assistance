"use client";

import type { MusicTrack } from "@/types/music";

import { MusicTrackTile } from "@/components/music/MusicTrackTile";

interface MusicTrackRowProps {
  tracks: MusicTrack[];
  queue?: MusicTrack[];
  getBadge?: (track: MusicTrack, index: number) => string | undefined;
  getReason?: (track: MusicTrack, index: number) => string | undefined;
}

export function MusicTrackRow({
  tracks,
  queue,
  getBadge,
  getReason,
}: MusicTrackRowProps) {
  const resolvedQueue = queue ?? tracks;

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-thin">
      {tracks.map((track, index) => (
        <MusicTrackTile
          key={track.videoId}
          track={track}
          queue={resolvedQueue}
          badge={getBadge?.(track, index)}
          reason={getReason?.(track, index)}
        />
      ))}
    </div>
  );
}
