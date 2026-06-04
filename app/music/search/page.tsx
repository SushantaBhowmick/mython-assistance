"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/music/EmptyState";
import { MusicSearchResultsSkeleton } from "@/components/music/MusicSectionSkeletons";
import { MusicSearchInput } from "@/components/music/MusicSearchInput";
import { MusicTrackCard } from "@/components/music/MusicTrackCard";
import {
  getApiErrorMessage,
  getFavorites,
  getYouTubeQuotaStatus,
  searchMusic,
} from "@/lib/music/api-client";
import { MIN_SEARCH_QUERY_LENGTH } from "@/lib/music/normalize";
import type { MusicTrack, SearchSource, YouTubeQuotaStatus } from "@/types/music";

function getStatusLabel(source: SearchSource | undefined, quotaExceeded?: boolean) {
  if (quotaExceeded || source === "local-fallback") {
    return "Quota limit reached — showing local results";
  }
  if (source === "cache") {
    return "Using cached results";
  }
  if (source === "youtube") {
    return "Live YouTube search";
  }
  return null;
}

export default function MusicSearchPage() {
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<YouTubeQuotaStatus | null>(null);
  const lastResultsRef = useRef<{ query: string; count: number }>({
    query: "",
    count: 0,
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getFavorites()
      .then(({ favorites }) => {
        setFavoriteIds(new Set(favorites.map((item) => item.track.videoId)));
      })
      .catch(() => undefined);

    getYouTubeQuotaStatus()
      .then(setQuotaStatus)
      .catch(() => undefined);
  }, []);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    const normalized = trimmed.toLowerCase();
    setSubmittedQuery(trimmed);

    abortRef.current?.abort();

    if (trimmed.length < MIN_SEARCH_QUERY_LENGTH) {
      setTracks([]);
      setError(null);
      setInfo("Search requires at least 3 characters.");
      setLoading(false);
      return;
    }

    if (
      lastResultsRef.current.query === normalized &&
      lastResultsRef.current.count > 0
    ) {
      setInfo("Showing previous results for this query.");
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const result = await searchMusic(trimmed, controller.signal);
      if (controller.signal.aborted) return;

      setTracks(result.tracks);
      setInfo(getStatusLabel(result.source, result.quotaExceeded));

      if (result.tracks.length > 0) {
        lastResultsRef.current = { query: normalized, count: result.tracks.length };
        setError(null);
      } else {
        setError(
          result.message ??
            "No cached or local results found yet. Save songs to your library or try again after quota cooldown.",
        );
      }

      if (result.quotaExceeded) {
        getYouTubeQuotaStatus().then(setQuotaStatus).catch(() => undefined);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof Error && err.name === "AbortError") return;

      setTracks([]);
      setError(getApiErrorMessage(err, "Search failed"));
      setInfo(null);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Press Enter or click Search. Results are cached for 90 days. Live YouTube
          calls happen only when no cache exists.
        </p>
      </div>

      {quotaStatus?.liveSearchDisabled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
          Live YouTube search is paused until{" "}
          {quotaStatus.liveSearchDisabledUntil
            ? new Date(quotaStatus.liveSearchDisabledUntil).toLocaleString()
            : "cooldown ends"}
          . Cached and local library results still work.
        </div>
      )}

      <MusicSearchInput onSearch={runSearch} disabled={loading} />

      <p className="text-sm text-muted-foreground">
        Search requires at least 3 characters. Press Enter or click Search.
      </p>

      {loading && <MusicSearchResultsSkeleton />}

      {info && !loading && (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          {info}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && tracks.length > 0 && (
        <div className="space-y-3">
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
        submittedQuery.trim().length >= MIN_SEARCH_QUERY_LENGTH &&
        tracks.length === 0 &&
        !error && (
          <EmptyState
            title="No results"
            description="Try another spelling or save tracks to your library for local search fallback."
          />
        )}

      {!loading && submittedQuery.trim().length < MIN_SEARCH_QUERY_LENGTH && (
        <EmptyState
          title="Search your music"
          description="Find tracks on YouTube and play them instantly."
        />
      )}
    </div>
  );
}
