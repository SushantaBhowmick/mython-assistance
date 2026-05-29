"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/music/EmptyState";
import { LoadingState } from "@/components/music/LoadingState";
import { MusicSearchInput } from "@/components/music/MusicSearchInput";
import { MusicTrackCard } from "@/components/music/MusicTrackCard";
import { getFavorites, searchMusic } from "@/lib/music/api-client";
import { MIN_SEARCH_QUERY_LENGTH } from "@/lib/music/normalize";
import { isOnline } from "@/lib/pwa";
import type { MusicTrack } from "@/types/music";

export default function MusicSearchPage() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<boolean | null>(null);

  useEffect(() => {
    getFavorites()
      .then(({ favorites }) => {
        setFavoriteIds(new Set(favorites.map((item) => item.track.videoId)));
      })
      .catch(() => {
        // Favorites are optional for search UI hints.
      });
  }, []);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();

    if (trimmed.length < MIN_SEARCH_QUERY_LENGTH) {
      setTracks([]);
      setError(null);
      setCached(null);
      return;
    }

    if (!isOnline()) {
      setTracks([]);
      setError("You are offline. Reconnect to search YouTube.");
      setCached(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await searchMusic(trimmed);
      setTracks(result.tracks);
      setCached(result.cached);
    } catch (err) {
      setTracks([]);
      setError(err instanceof Error ? err.message : "Search failed");
      setCached(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
          <p className="text-muted-foreground">
            Results are cached for 7 days to save YouTube API quota.
          </p>
        </div>

        <MusicSearchInput value={query} onChange={setQuery} />

        {query.trim().length > 0 && query.trim().length < MIN_SEARCH_QUERY_LENGTH && (
          <p className="text-sm text-muted-foreground">
            Type at least {MIN_SEARCH_QUERY_LENGTH} characters to search.
          </p>
        )}

        {loading && <LoadingState label="Searching YouTube..." />}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && tracks.length > 0 && (
          <div className="space-y-3">
            {cached !== null && (
              <p className="text-xs text-muted-foreground">
                {cached ? "Served from cache" : "Fresh results from YouTube"}
              </p>
            )}
            {tracks.map((track) => (
              <MusicTrackCard
                key={track.videoId}
                track={track}
                queue={tracks}
                isFavorite={favoriteIds.has(track.videoId)}
              />
            ))}
          </div>
        )}

        {!loading &&
          !error &&
          query.trim().length >= MIN_SEARCH_QUERY_LENGTH &&
          tracks.length === 0 && (
            <EmptyState
              title="No results"
              description="Try a different search term or artist name."
            />
          )}

        {!loading && !error && query.trim().length < MIN_SEARCH_QUERY_LENGTH && (
          <EmptyState
            title="Search your music"
            description="Find tracks on YouTube and play them instantly."
          />
        )}
    </div>
  );
}
