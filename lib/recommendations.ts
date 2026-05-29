import "server-only";

import { getCachedDiscoveryTracks } from "@/lib/youtube/cache";
import { toSavedTrack } from "@/lib/music/normalize";
import { prisma, safePrismaRead } from "@/lib/prisma/client";
import type { MusicTrack } from "@/types/music";

export type RecommendationReason =
  | "Because you played this artist"
  | "From your saved music"
  | "Recently discovered"
  | "Popular in your library"
  | "You may like this";

export interface RecommendationItem {
  track: MusicTrack;
  reason: RecommendationReason;
}

export interface RecommendationsResult {
  items: RecommendationItem[];
  degraded: boolean;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function getRecommendations(
  userId: string,
  options: { limit?: number; excludeVideoId?: string } = {},
): Promise<RecommendationsResult> {
  const limit = options.limit ?? 20;
  const excludeVideoId = options.excludeVideoId;

  const [statsResult, favoritesResult, savedResult, cachedTracks] = await Promise.all([
    safePrismaRead(
      () =>
        prisma.trackStats.findMany({
          where: { userId },
          include: { track: true },
          orderBy: [{ playCount: "desc" }, { lastPlayedAt: "desc" }],
          take: 30,
        }),
      [],
      "recommendations/stats",
    ),
    safePrismaRead(
      () =>
        prisma.favorite.findMany({
          where: { userId },
          include: { track: true },
          take: 30,
        }),
      [],
      "recommendations/favorites",
    ),
    safePrismaRead(
      () =>
        prisma.savedTrack.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 40,
        }),
      [],
      "recommendations/saved",
    ),
    getCachedDiscoveryTracks(30),
  ]);

  const stats = statsResult.data;
  const favorites = favoritesResult.data;
  const savedTracks = savedResult.data;
  const degraded =
    statsResult.degraded ||
    favoritesResult.degraded ||
    savedResult.degraded;

  const topChannels = new Map<string, number>();
  for (const stat of stats.slice(0, 10)) {
    topChannels.set(
      stat.track.channelTitle.toLowerCase(),
      (topChannels.get(stat.track.channelTitle.toLowerCase()) ?? 0) + stat.playCount,
    );
  }

  const favoriteVideoIds = new Set(favorites.map((item) => item.track.videoId));
  const savedVideoIds = new Set(savedTracks.map((track) => track.videoId));
  const recentVideoIds = new Set(stats.slice(0, 8).map((item) => item.track.videoId));
  const seen = new Set<string>();
  const scored: Array<{ track: MusicTrack; reason: RecommendationReason; score: number }> =
    [];

  function add(track: MusicTrack, reason: RecommendationReason, score: number) {
    if (excludeVideoId && track.videoId === excludeVideoId) return;
    if (seen.has(track.videoId)) return;
    seen.add(track.videoId);
    scored.push({ track, reason, score });
  }

  for (const stat of stats) {
    const track = toSavedTrack(stat.track);
    if (stat.playCount >= 3) {
      add(track, "Popular in your library", 80 + stat.playCount);
      continue;
    }

    const channelScore = topChannels.get(track.channelTitle.toLowerCase()) ?? 0;
    if (channelScore > 0) {
      add(track, "Because you played this artist", 60 + channelScore);
    } else if (!recentVideoIds.has(track.videoId)) {
      add(track, "From your saved music", 40 + stat.playCount);
    }
  }

  for (const favorite of favorites) {
    add(toSavedTrack(favorite.track), "From your saved music", 35);
  }

  for (const track of savedTracks) {
    if (favoriteVideoIds.has(track.videoId)) continue;
    add(toSavedTrack(track), "From your saved music", 25);
  }

  for (const track of shuffle(cachedTracks)) {
    if (savedVideoIds.has(track.videoId)) continue;
    add(track, "Recently discovered", 20);
  }

  if (scored.length < limit) {
    for (const track of shuffle(cachedTracks)) {
      add(track, "You may like this", 10);
      if (scored.length >= limit) break;
    }
  }

  return {
    items: scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ track, reason }) => ({ track, reason })),
    degraded,
  };
}
