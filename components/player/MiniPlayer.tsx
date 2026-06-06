"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";

import { TrackThumbnail } from "@/components/music/TrackThumbnail";
import { MOBILE_FOOTER_OFFSET } from "@/components/shell/MobileNavMenu";
import { PlayerControls } from "@/components/player/PlayerControls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/player-store";

function routeHasMobileFooter(pathname: string) {
  if (pathname.startsWith("/login") || pathname === "/offline") return false;
  if (pathname.startsWith("/settings")) return false;
  return true;
}

export function MiniPlayer() {
  const pathname = usePathname();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const clearPlayer = usePlayerStore((s) => s.clearPlayer);
  const hasMobileFooter = routeHasMobileFooter(pathname);

  if (!currentTrack) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:bottom-0",
        hasMobileFooter
          ? "bottom-[calc(var(--mobile-footer)+env(safe-area-inset-bottom))]"
          : "bottom-0 player-safe-bottom",
      )}
      style={{ ["--mobile-footer" as string]: MOBILE_FOOTER_OFFSET }}
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
