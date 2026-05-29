"use client";

import { Pause, Play } from "lucide-react";

import { TrackThumbnail } from "@/components/music/TrackThumbnail";
import { Badge } from "@/components/ui/badge";
import { usePlayerStore } from "@/store/player-store";
import type { MusicTrack } from "@/types/music";
import { cn } from "@/lib/utils";

interface MusicTrackTileProps {
  track: MusicTrack;
  queue?: MusicTrack[];
  badge?: string;
  reason?: string;
  className?: string;
}

export function MusicTrackTile({
  track,
  queue,
  badge,
  reason,
  className,
}: MusicTrackTileProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const isCurrent = currentTrack?.videoId === track.videoId;
  const playing = isCurrent && isPlaying;

  function handlePlay() {
    if (isCurrent) {
      togglePlay();
      return;
    }

    playTrack(track, queue ?? [track], 0);
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={cn(
        "group w-36 shrink-0 text-left",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-xl border bg-card/50">
        <div className="aspect-square w-full">
          <TrackThumbnail src={track.thumbnailUrl} alt={track.title} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {playing ? (
            <Pause className="size-6 text-white" />
          ) : (
            <Play className="size-6 text-white" />
          )}
        </div>
        {badge && (
          <Badge className="absolute left-2 top-2" variant="secondary">
            {badge}
          </Badge>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium">{track.title}</p>
      <p className="line-clamp-1 text-xs text-muted-foreground">
        {track.channelTitle}
      </p>
      {reason && (
        <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
          {reason}
        </p>
      )}
    </button>
  );
}
