import "server-only";

import { getUserId } from "@/lib/auth/user";
import { AppError } from "@/lib/errors/app-error";
import {
  getCacheExpiryDate,
  MIN_SEARCH_QUERY_LENGTH,
  normalizeSearchQuery,
} from "@/lib/music/normalize";
import { dedupeTracks, searchLocalMusic } from "@/lib/local-music-search";
import {
  findSimilarCachedSearch,
  getExactCachedSearch,
  setCachedSearch,
  touchCachedSearch,
} from "@/lib/youtube/cache";
import { isYouTubeLimitError } from "@/lib/youtube/errors";
import {
  getQuotaStatus,
  isLiveSearchDisabled,
  recordLiveSearchAttempt,
  recordQuotaError,
} from "@/lib/youtube/quota-state";
import { dedupeSearchRequest } from "@/lib/youtube/search-dedup";
import { searchYouTube } from "@/lib/youtube/search";
import { waitForYouTubeSearchSlot } from "@/lib/youtube/throttle";
import type { MusicTrack, SearchSource, YouTubeSearchResponse } from "@/types/music";

const QUOTA_MESSAGE =
  "YouTube quota limit reached. Showing cached/local results only.";

function buildResponse(input: {
  tracks: MusicTrack[];
  query: string;
  cached: boolean;
  source: SearchSource;
  matchedQuery?: string;
  quotaExceeded?: boolean;
  message?: string;
}): YouTubeSearchResponse {
  return {
    tracks: input.tracks,
    items: input.tracks,
    cached: input.cached,
    query: input.query,
    source: input.source,
    matchedQuery: input.matchedQuery,
    quotaExceeded: input.quotaExceeded,
    message: input.message,
  };
}

async function buildQuotaFallback(
  userId: string,
  query: string,
  rawQuery: string,
): Promise<YouTubeSearchResponse> {
  const [similar, local] = await Promise.all([
    findSimilarCachedSearch(query, { allowStale: true }),
    searchLocalMusic(userId, rawQuery),
  ]);

  const tracks = dedupeTracks([...(similar?.tracks ?? []), ...local]);

  if (tracks.length > 0 && similar?.matchedQuery && similar.matchedQuery !== query) {
    await setCachedSearch(query, tracks, similar.expiresAt);
  }

  return buildResponse({
    tracks,
    query,
    cached: true,
    source: "local-fallback",
    matchedQuery: similar?.matchedQuery,
    quotaExceeded: true,
    message: QUOTA_MESSAGE,
  });
}

async function executeSearch(rawQuery: string, userId: string): Promise<YouTubeSearchResponse> {
  const query = normalizeSearchQuery(rawQuery);

  const exactCache = await getExactCachedSearch(query);
  if (exactCache) {
    await touchCachedSearch(query);
    return buildResponse({
      tracks: exactCache.tracks,
      query,
      cached: true,
      source: "cache",
      matchedQuery:
        exactCache.matchedQuery !== query ? exactCache.matchedQuery : undefined,
    });
  }

  if (await isLiveSearchDisabled()) {
    return buildQuotaFallback(userId, query, rawQuery);
  }

  try {
    await recordLiveSearchAttempt();
    await waitForYouTubeSearchSlot();
    const tracks = await searchYouTube(rawQuery.trim());
    await setCachedSearch(query, tracks, getCacheExpiryDate());

    return buildResponse({
      tracks,
      query,
      cached: false,
      source: "youtube",
    });
  } catch (error) {
    if (isYouTubeLimitError(error)) {
      await recordQuotaError();
      return buildQuotaFallback(userId, query, rawQuery);
    }

    throw error;
  }
}

export async function handleYouTubeSearchRequest(rawQuery: string): Promise<YouTubeSearchResponse> {
  if (rawQuery.trim().length < MIN_SEARCH_QUERY_LENGTH) {
    throw new AppError(
      `Search requires at least ${MIN_SEARCH_QUERY_LENGTH} characters`,
      400,
      "QUERY_TOO_SHORT",
    );
  }

  const userId = await getUserId();
  const query = normalizeSearchQuery(rawQuery);

  return dedupeSearchRequest(query, () => executeSearch(rawQuery, userId));
}

export async function getYouTubeQuotaStatusForApi() {
  return getQuotaStatus();
}
