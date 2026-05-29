"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/music/EmptyState";
import { LoadingState } from "@/components/music/LoadingState";
import { MusicTrackCard } from "@/components/music/MusicTrackCard";
import { ShufflePlayButton } from "@/components/music/ShufflePlayButton";
import { getPlaylist } from "@/lib/music/api-client";
import type { PlaylistDetail } from "@/types/music";

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    getPlaylist(params.id)
      .then(({ playlist: data }) => setPlaylist(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load playlist"))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="space-y-6">
        {loading && <LoadingState label="Loading playlist..." />}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && playlist && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{playlist.name}</h1>
                <p className="text-muted-foreground">
                  {playlist.description || "No description"}
                </p>
              </div>
              {playlist.tracks.length > 0 && (
                <ShufflePlayButton tracks={playlist.tracks} />
              )}
            </div>

            {playlist.tracks.length === 0 ? (
              <EmptyState
                title="This playlist is empty"
                description="Add tracks from search using the menu on any song card."
              />
            ) : (
              <div className="space-y-3">
                {playlist.tracks.map((track) => (
                  <MusicTrackCard
                    key={track.id}
                    track={track}
                    queue={playlist.tracks}
                    savedTrackId={track.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
    </div>
  );
}
