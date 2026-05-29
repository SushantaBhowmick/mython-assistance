"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { LoadingState } from "@/components/music/LoadingState";
import { MusicOnboarding } from "@/components/music/MusicOnboarding";
import { MusicSection } from "@/components/music/MusicSection";
import { MusicTrackCard } from "@/components/music/MusicTrackCard";
import { MusicTrackRow } from "@/components/music/MusicTrackRow";
import { ShufflePlayButton } from "@/components/music/ShufflePlayButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getDiscoveries,
  getFavorites,
  getHistory,
  getPlaylists,
  getRecommendations,
} from "@/lib/music/api-client";
import { usePlayerStore } from "@/store/player-store";
import type { MusicTrack, PlaylistSummary, RecommendationItem } from "@/types/music";

export function MusicHomeDiscovery() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [recent, setRecent] = useState<MusicTrack[]>([]);
  const [mostPlayed, setMostPlayed] = useState<Array<MusicTrack & { playCount?: number }>>(
    [],
  );
  const [favorites, setFavorites] = useState<MusicTrack[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [discoveries, setDiscoveries] = useState<MusicTrack[]>([]);

  const loadHome = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDegraded(false);

    const results = await Promise.allSettled([
      getHistory({ sort: "recent", limit: 10 }),
      getHistory({ sort: "most-played", limit: 10 }),
      getFavorites(),
      getPlaylists(),
      getRecommendations({ limit: 20, exclude: currentTrack?.videoId }),
      getDiscoveries(20),
    ]);

    let sawDegraded = false;
    let failedCount = 0;

    function readResult<T>(index: number, fallback: T): T {
      const result = results[index];
      if (result.status !== "fulfilled") {
        failedCount += 1;
        return fallback;
      }

      const value = result.value as unknown as T & { degraded?: boolean };
      if (value && typeof value === "object" && "degraded" in value && value.degraded) {
        sawDegraded = true;
      }

      return value;
    }

    const recentRes = readResult(0, { history: [] as Awaited<ReturnType<typeof getHistory>>["history"] });
    const mostRes = readResult(1, { history: [] as Awaited<ReturnType<typeof getHistory>>["history"] });
    const favRes = readResult(2, { favorites: [] as Awaited<ReturnType<typeof getFavorites>>["favorites"] });
    const playlistRes = readResult(3, { playlists: [] as Awaited<ReturnType<typeof getPlaylists>>["playlists"] });
    const recRes = readResult(4, { items: [] as Awaited<ReturnType<typeof getRecommendations>>["items"] });
    const discRes = readResult(5, { tracks: [] as Awaited<ReturnType<typeof getDiscoveries>>["tracks"], cached: true });

    setRecent(recentRes.history.map((item) => item.track));
    setMostPlayed(
      mostRes.history.map((item) => ({
        ...item.track,
        playCount: item.playCount,
      })),
    );
    setFavorites(favRes.favorites.map((item) => item.track));
    setPlaylists(playlistRes.playlists.slice(0, 6));
    setRecommendations(recRes.items);
    setDiscoveries(discRes.tracks);

    setDegraded(sawDegraded);
    if (failedCount > 0) {
      setError("Some library sections could not load. Database may be reconnecting — try Refresh.");
    }

    setLoading(false);
  }, [currentTrack?.videoId]);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  const hasLocalData =
    recent.length > 0 ||
    favorites.length > 0 ||
    playlists.length > 0 ||
    mostPlayed.length > 0;

  const continueTrack = currentTrack ?? recent[0] ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your music</h1>
          <p className="text-muted-foreground">
            Pick up where you left off, replay favorites, and explore recommendations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadHome} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading && <LoadingState label="Loading your library..." />}

      {degraded && !loading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
          Database connection was unstable. Showing available cached data where possible.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !hasLocalData && !error && <MusicOnboarding />}

      {!loading && continueTrack && (
        <MusicSection
          title="Continue listening"
          description="Resume your current session or last played track."
        >
          <MusicTrackCard
            track={continueTrack}
            queue={recent.length > 0 ? recent : [continueTrack]}
            savedTrackId={"id" in continueTrack ? continueTrack.id : undefined}
          />
        </MusicSection>
      )}

      {!loading && recent.length > 0 && (
        <MusicSection
          title="Recently played"
          action={<ShufflePlayButton tracks={recent} />}
        >
          <MusicTrackRow tracks={recent} queue={recent} />
        </MusicSection>
      )}

      {!loading && mostPlayed.length > 0 && (
        <MusicSection
          title="Most played"
          description="Your top tracks by play count."
          action={<ShufflePlayButton tracks={mostPlayed} />}
        >
          <MusicTrackRow
            tracks={mostPlayed}
            queue={mostPlayed}
            getBadge={(track) => {
              const count = (track as MusicTrack & { playCount?: number }).playCount;
              return count ? `${count} plays` : undefined;
            }}
          />
        </MusicSection>
      )}

      {!loading && favorites.length > 0 && (
        <MusicSection
          title="Favorites"
          action={
            <div className="flex gap-2">
              <ShufflePlayButton tracks={favorites} />
              <Button asChild variant="ghost" size="sm">
                <Link href="/music/favorites">View all</Link>
              </Button>
            </div>
          }
        >
          <MusicTrackRow tracks={favorites.slice(0, 10)} queue={favorites} />
        </MusicSection>
      )}

      {!loading && playlists.length > 0 && (
        <MusicSection
          title="Your playlists"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/music/playlists">View all</Link>
            </Button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="bg-card/50">
                <CardContent className="p-4">
                  <Link href={`/music/playlists/${playlist.id}`} className="block">
                    <p className="font-medium">{playlist.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {playlist.trackCount} tracks
                    </p>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </MusicSection>
      )}

      {!loading && recommendations.length > 0 && (
        <MusicSection
          title="Recommended for you"
          description="Personal picks from your library and cached discoveries."
          action={<ShufflePlayButton tracks={recommendations.map((item) => item.track)} label="Shuffle picks" />}
        >
          <MusicTrackRow
            tracks={recommendations.map((item) => item.track)}
            queue={recommendations.map((item) => item.track)}
            getReason={(track) =>
              recommendations.find((item) => item.track.videoId === track.videoId)?.reason
            }
          />
        </MusicSection>
      )}

      {!loading && discoveries.length > 0 && (
        <MusicSection
          title="Cached discoveries"
          description="Tracks from previous searches — no new YouTube API calls."
        >
          <MusicTrackRow tracks={discoveries} queue={discoveries} />
        </MusicSection>
      )}
    </div>
  );
}
