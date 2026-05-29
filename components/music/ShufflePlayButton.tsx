"use client";

import { Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/player-store";
import type { MusicTrack } from "@/types/music";
import { cn } from "@/lib/utils";

interface ShufflePlayButtonProps {
  tracks: MusicTrack[];
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
  className?: string;
  label?: string;
}

export function ShufflePlayButton({
  tracks,
  variant = "secondary",
  size = "sm",
  className,
  label = "Shuffle",
}: ShufflePlayButtonProps) {
  const playShuffledQueue = usePlayerStore((s) => s.playShuffledQueue);

  if (tracks.length === 0) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      onClick={() => playShuffledQueue(tracks)}
    >
      <Shuffle className="size-4" />
      {label}
    </Button>
  );
}
