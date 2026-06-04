"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";

import { TrackThumbnail } from "@/components/music/TrackThumbnail";
import { PlayerControls } from "@/components/player/PlayerControls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/player-store";

export function MiniPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const clearPlayer = usePlayerStore((s) => s.clearPlayer);
  const pathname = usePathname();
  const isMusicRoute = pathname.startsWith("/music");

  if (!currentTrack) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        isMusicRoute
          ? "bottom-[calc(3.25rem+env(safe-area-inset-bottom))] md:bottom-0"
          : "bottom-0 player-safe-bottom",
      )}
    >
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-md">
            <TrackThumbnail
              src={currentTrack.thumbnailUrl}
              alt={currentTrack.title}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{currentTrack.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {currentTrack.channelTitle}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => clearPlayer()}
            aria-label="Close player"
          >
            <X className="size-4" />
          </Button>
        </div>

        <PlayerControls variant="mini" />
      </div>
    </div>
  );
}
