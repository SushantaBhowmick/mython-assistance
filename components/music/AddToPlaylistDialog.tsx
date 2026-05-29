"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  addTrackToPlaylist,
  getPlaylists,
  saveTrack,
} from "@/lib/music/api-client";
import type { MusicTrack, PlaylistSummary } from "@/types/music";

interface AddToPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: MusicTrack;
  savedTrackId?: string;
  onSaved?: (trackId: string) => void;
}

export function AddToPlaylistDialog({
  open,
  onOpenChange,
  track,
  savedTrackId,
  onSaved,
}: AddToPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    getPlaylists()
      .then(({ playlists: data }) => setPlaylists(data))
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Failed to load playlists");
      })
      .finally(() => setLoading(false));
  }, [open]);

  async function handleAdd(playlistId: string) {
    setAddingId(playlistId);
    try {
      let trackId = savedTrackId;
      if (!trackId) {
        const { track: saved } = await saveTrack(track);
        trackId = saved.id;
        onSaved?.(saved.id);
      }

      await addTrackToPlaylist(playlistId, { trackId });
      toast.success("Added to playlist");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add to playlist");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to playlist</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading playlists...</p>
        ) : playlists.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No playlists yet. Create one first.
          </p>
        ) : (
          <ScrollArea className="max-h-72 pr-2">
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <Button
                  key={playlist.id}
                  variant="outline"
                  className="h-auto w-full justify-between py-3"
                  onClick={() => handleAdd(playlist.id)}
                  disabled={addingId === playlist.id}
                >
                  <span className="truncate text-left">{playlist.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {playlist.trackCount} tracks
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
