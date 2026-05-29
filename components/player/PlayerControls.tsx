"use client";

import {
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatPlayerTime } from "@/lib/player/youtube-types";
import { usePlayerStore } from "@/store/player-store";
import { cn } from "@/lib/utils";

interface PlayerControlsProps {
  variant?: "mini" | "full";
  className?: string;
}

export function PlayerControls({ variant = "mini", className }: PlayerControlsProps) {
  const {
    isPlaying,
    duration,
    currentTime,
    queue,
    currentIndex,
    volume,
    muted,
    togglePlay,
    previous,
    next,
    skipBy,
    seekTo,
    setVolume,
    setMuted,
  } = usePlayerStore();

  const maxDuration = duration > 0 ? duration : Math.max(currentTime, 1);
  const progressValue = duration > 0 ? currentTime : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">
          {formatPlayerTime(currentTime)}
        </span>
        <Slider
          value={[progressValue]}
          min={0}
          max={maxDuration}
          step={1}
          onValueChange={(value) => {
            const nextTime = value[0] ?? 0;
            usePlayerStore.setState({ currentTime: nextTime });
          }}
          onValueCommit={(value) => {
            seekTo(value[0] ?? 0);
          }}
          className="flex-1"
          aria-label="Seek"
        />
        <span className="w-10 text-[11px] tabular-nums text-muted-foreground">
          {formatPlayerTime(duration)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? (
              <VolumeX className="size-4" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </Button>
          <Slider
            value={[muted ? 0 : volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => setVolume(value[0] ?? 0)}
            className="w-24"
            aria-label="Volume"
          />
        </div>

        <div className="flex flex-1 items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => skipBy(-10)}
            aria-label="Skip back 10 seconds"
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={previous} aria-label="Previous">
            <SkipBack className="size-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={next} aria-label="Next">
            <SkipForward className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => skipBy(10)}
            aria-label="Skip forward 10 seconds"
          >
            <RotateCw className="size-4" />
          </Button>
        </div>

        <div className="hidden text-xs text-muted-foreground sm:block">
          {queue.length > 0 && currentIndex >= 0
            ? `${currentIndex + 1} / ${queue.length}`
            : "—"}
        </div>
      </div>

      {variant === "full" && (
        <p className="text-center text-xs text-muted-foreground">
          Lock screen / notification controls work where your browser and OS support Media Session.
        </p>
      )}
    </div>
  );
}
