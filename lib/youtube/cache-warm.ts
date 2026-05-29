import "server-only";

import {
  getCacheExpiryDate,
  normalizeSearchQuery,
  MIN_SEARCH_QUERY_LENGTH,
} from "@/lib/music/normalize";
import { setCachedSearch } from "@/lib/youtube/cache";
import { prisma } from "@/lib/prisma/client";
import type { MusicTrack } from "@/types/music";

function cacheQueriesForTrack(track: MusicTrack): string[] {
  const candidates = [
    normalizeSearchQuery(track.title),
    normalizeSearchQuery(track.channelTitle),
    normalizeSearchQuery(`${track.channelTitle} ${track.title}`),
  ];

  return [...new Set(candidates.filter((query) => query.length >= MIN_SEARCH_QUERY_LENGTH))];
}

async function mergeTrackIntoCacheQuery(query: string, track: MusicTrack) {
  const existing = await prisma.youTubeCache.findUnique({ where: { query } });
  const current = existing ? (existing.results as MusicTrack[]) : [];
  const merged = [track, ...current.filter((item) => item.videoId !== track.videoId)].slice(
    0,
    20,
  );

  await setCachedSearch(query, merged, getCacheExpiryDate());
}

export async function warmSearchCacheFromTrack(track: MusicTrack): Promise<void> {
  try {
    for (const query of cacheQueriesForTrack(track)) {
      await mergeTrackIntoCacheQuery(query, track);
    }
  } catch (error) {
    console.warn("[youtube/cache-warm] failed:", error);
  }
}
