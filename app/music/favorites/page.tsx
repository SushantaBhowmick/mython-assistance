"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/music/EmptyState";
import { LoadingState } from "@/components/music/LoadingState";
import { MusicTrackCard } from "@/components/music/MusicTrackCard";
import { getFavorites } from "@/lib/music/api-client";
import type { SavedTrack } from "@/types/music";

export default function FavoritesPage() {
  const [tracks, setTracks] = useState<SavedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFavorites()
      .then(({ favorites }) => setTracks(favorites.map((item) => item.track)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load favorites"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
          <p className="text-muted-foreground">Songs you have marked as favorites.</p>
        </div>

        {loading && <LoadingState label="Loading favorites..." />}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && tracks.length === 0 && (
          <EmptyState
            title="No favorites yet"
            description="Save songs from search and tap the heart icon to favorite them."
          />
        )}

        {!loading && !error && tracks.length > 0 && (
          <div className="space-y-3">
            {tracks.map((track) => (
              <MusicTrackCard
                key={track.id}
                track={track}
                queue={tracks}
                isFavorite
                savedTrackId={track.id}
              />
            ))}
          </div>
        )}
    </div>
  );
}
