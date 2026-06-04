"use client";

import { useEffect, useState } from "react";

import { CreatePlaylistDialog } from "@/components/music/CreatePlaylistDialog";
import { EmptyState } from "@/components/music/EmptyState";
import { MusicPlaylistCardsSkeleton } from "@/components/music/MusicSectionSkeletons";
import { PlaylistCard } from "@/components/music/PlaylistCard";
import { Button } from "@/components/ui/button";
import { getPlaylists } from "@/lib/music/api-client";
import type { PlaylistSummary } from "@/types/music";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPlaylists() {
    setLoading(true);
    setError(null);
    try {
      const { playlists: data } = await getPlaylists();
      setPlaylists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlists");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaylists();
  }, []);

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Playlists</h1>
            <p className="text-muted-foreground">Organize tracks into custom collections.</p>
          </div>
          <CreatePlaylistDialog
            trigger={<Button>Create playlist</Button>}
            onCreated={loadPlaylists}
          />
        </div>

        {loading && <MusicPlaylistCardsSkeleton />}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && playlists.length === 0 && (
          <EmptyState
            title="No playlists yet"
            description="Create your first playlist and add tracks from search."
            action={
              <CreatePlaylistDialog
                trigger={<Button variant="secondary">Create playlist</Button>}
                onCreated={loadPlaylists}
              />
            }
          />
        )}

        {!loading && !error && playlists.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        )}
    </div>
  );
}
