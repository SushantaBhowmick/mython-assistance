import { Prisma } from "@prisma/client";

import { jsonError, jsonOk } from "@/lib/api/response";
import { getServerEnv } from "@/lib/env";
import {
  getCacheExpiryDate,
  MIN_SEARCH_QUERY_LENGTH,
  normalizeSearchQuery,
} from "@/lib/music/normalize";
import { prisma } from "@/lib/prisma/client";
import { searchYouTube } from "@/lib/youtube/search";
import type { MusicTrack } from "@/types/music";

export async function GET(request: Request) {
  try {
    getServerEnv();

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q") ?? "";

    if (rawQuery.trim().length < MIN_SEARCH_QUERY_LENGTH) {
      return jsonError(
        `Search query must be at least ${MIN_SEARCH_QUERY_LENGTH} characters`,
        400,
      );
    }

    const query = normalizeSearchQuery(rawQuery);
    const now = new Date();

    const cached = await prisma.youTubeCache.findUnique({
      where: { query },
    });

    if (cached && cached.expiresAt > now) {
      return jsonOk({
        tracks: cached.results as unknown as MusicTrack[],
        cached: true,
        query,
      });
    }

    const tracks = await searchYouTube(rawQuery.trim());

    await prisma.youTubeCache.upsert({
      where: { query },
      create: {
        query,
        results: tracks as unknown as Prisma.InputJsonValue,
        expiresAt: getCacheExpiryDate(now),
      },
      update: {
        results: tracks as unknown as Prisma.InputJsonValue,
        expiresAt: getCacheExpiryDate(now),
      },
    });

    return jsonOk({
      tracks,
      cached: false,
      query,
    });
  } catch (error) {
    console.error("[youtube/search]", error);
    const message =
      error instanceof Error ? error.message : "Failed to search YouTube";
    return jsonError(message, 500);
  }
}
