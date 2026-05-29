"use client";

import {
  Heart,
  ListMusic,
  MoreHorizontal,
  Pause,
  Play,
  Save,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { AddToPlaylistDialog } from "@/components/music/AddToPlaylistDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addFavorite,
  removeFavorite,
  saveTrack,
} from "@/lib/music/api-client";
import { usePlayerStore } from "@/store/player-store";
import type { MusicTrack } from "@/types/music";
import { cn } from "@/lib/utils";

interface MusicTrackCardProps {
  track: MusicTrack;
  queue?: MusicTrack[];
  isFavorite?: boolean;
  savedTrackId?: string;
  showActions?: boolean;
  className?: string;
}

export function MusicTrackCard({
  track,
  queue,
  isFavorite = false,
  savedTrackId,
  showActions = true,
  className,
}: MusicTrackCardProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const [favorite, setFavorite] = useState(isFavorite);
  const [trackId, setTrackId] = useState(savedTrackId ?? track.id);
  const [saving, setSaving] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const isCurrent = currentTrack?.videoId === track.videoId;
  const playing = isCurrent && isPlaying;

  async function ensureSaved(): Promise<string | undefined> {
    if (trackId) return trackId;

    setSaving(true);
    try {
      const { track: saved } = await saveTrack(track);
      setTrackId(saved.id);
      toast.success("Track saved");
      return saved.id;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save track");
      return undefined;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    await ensureSaved();
  }

  async function handleFavoriteToggle() {
    const id = trackId ?? (await ensureSaved());
    if (!id) return;

    try {
      if (favorite) {
        await removeFavorite(id);
        setFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await addFavorite(id);
        setFavorite(true);
        toast.success("Added to favorites");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update favorite");
    }
  }

  function handlePlay() {
    if (isCurrent) {
      togglePlay();
      return;
    }

    playTrack(track, queue ?? [track], 0);
  }

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-xl border bg-card/50 p-3 transition-colors hover:bg-accent/40",
          isCurrent && "border-primary/40 bg-accent/30",
          className,
        )}
      >
        <button
          type="button"
          onClick={handlePlay}
          className="relative size-14 shrink-0 overflow-hidden rounded-lg"
        >
          <Image
            src={track.thumbnailUrl}
            alt={track.title}
            fill
            className="object-cover"
            sizes="56px"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            {playing ? (
              <Pause className="size-5 text-white" />
            ) : (
              <Play className="size-5 text-white" />
            )}
          </div>
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{track.title}</p>
          <p className="truncate text-sm text-muted-foreground">
            {track.channelTitle}
            {track.duration ? ` · ${track.duration}` : ""}
          </p>
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleFavoriteToggle}
              aria-label={favorite ? "Remove favorite" : "Add favorite"}
            >
              <Heart className={cn("size-4", favorite && "fill-red-500 text-red-500")} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="More actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSave} disabled={saving || Boolean(trackId)}>
                  <Save className="size-4" />
                  {trackId ? "Saved" : "Save track"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPlaylistOpen(true)}>
                  <ListMusic className="size-4" />
                  Add to playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <AddToPlaylistDialog
        open={playlistOpen}
        onOpenChange={setPlaylistOpen}
        track={track}
        savedTrackId={trackId}
        onSaved={(id) => setTrackId(id)}
      />
    </>
  );
}
