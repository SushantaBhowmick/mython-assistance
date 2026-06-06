"use client";

import Image from "next/image";
import { Play } from "lucide-react";

import type { MusicContinue } from "@/modules/dashboard/types";
import { usePlayerStore } from "@/store/player-store";

interface ContinueMusicWidgetProps {
  track: MusicContinue;
}

export function ContinueMusicWidget({ track }: ContinueMusicWidgetProps) {
  const selectTrack = usePlayerStore((s) => s.selectTrack);

  function handlePlay() {
    selectTrack({
      videoId: track.videoId,
      title: track.title,
      channelTitle: track.channelTitle,
      thumbnailUrl: track.thumbnailUrl,
      duration: null,
      source: "youtube",
    });
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className="flex w-full items-center gap-3 rounded-lg border bg-background/60 p-3 text-left transition-colors hover:bg-accent/50"
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-md">
        <Image src={track.thumbnailUrl} alt="" fill className="object-cover" sizes="48px" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Play className="size-5 text-white" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{track.title}</p>
        <p className="truncate text-xs text-muted-foreground">{track.channelTitle}</p>
      </div>
    </button>
  );
}
