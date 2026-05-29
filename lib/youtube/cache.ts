import "server-only";

import { Prisma } from "@prisma/client";

import { normalizeSearchQuery } from "@/lib/music/normalize";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";
import type { MusicTrack } from "@/types/music";

export interface CachedSearchResult {
  tracks: MusicTrack[];
  expiresAt: Date;
  matchedQuery: string;
  stale: boolean;
  fuzzy: boolean;
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function querySimilarity(a: string, b: string): number {
  if (a === b) return 1;

  let prefix = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }

  if (prefix >= 3) {
    return 0.55 + prefix / Math.max(a.length, b.length) * 0.45;
  }

  if (a.includes(b) || b.includes(a)) {
    return (
      0.5 + Math.min(a.length, b.length) / Math.max(a.length, b.length) * 0.45
    );
  }

  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function scoreAgainstCachedQuery(normalized: string, cachedQuery: string): number {
  const direct = querySimilarity(normalized, cachedQuery);
  let best = direct;

  for (const word of cachedQuery.split(/\s+/)) {
    if (word.length < 3) continue;
    best = Math.max(best, querySimilarity(normalized, word));
  }

  return best;
}

function toCachedResult(
  row: { query: string; results: unknown; expiresAt: Date },
  query: string,
  fuzzy: boolean,
): CachedSearchResult {
  return {
    tracks: row.results as unknown as MusicTrack[],
    expiresAt: row.expiresAt,
    matchedQuery: row.query,
    stale: row.expiresAt <= new Date(),
    fuzzy: fuzzy || row.query !== query,
  };
}

export async function touchCachedSearch(query: string): Promise<void> {
  try {
    await prisma.youTubeCache.updateMany({
      where: { query },
      data: { lastAccessedAt: new Date() },
    });
  } catch (error) {
    console.warn("[youtube/cache] touch failed:", error);
  }
}

export async function getExactCachedSearch(
  query: string,
): Promise<CachedSearchResult | null> {
  try {
    const cached = await withPrismaRetry(
      () => prisma.youTubeCache.findUnique({ where: { query } }),
      { label: "cache/exact-read" },
    );

    if (!cached) return null;

    return toCachedResult(cached, query, false);
  } catch (error) {
    console.warn("[youtube/cache] exact read failed:", error);
    return null;
  }
}

export async function getCachedSearch(
  query: string,
): Promise<CachedSearchResult | null> {
  const exact = await getExactCachedSearch(query);
  if (!exact) return null;

  await touchCachedSearch(query);
  return exact;
}

export async function findSimilarCachedSearch(
  query: string,
  options: { allowStale?: boolean } = {},
): Promise<CachedSearchResult | null> {
  const normalized = normalizeSearchQuery(query);
  if (normalized.length < MIN_SIMILAR_QUERY_LENGTH) return null;

  try {
    const exact = await prisma.youTubeCache.findUnique({
      where: { query: normalized },
    });

    if (exact) {
      const stale = exact.expiresAt <= new Date();
      if (!stale || options.allowStale) {
        await touchCachedSearch(normalized);
        return toCachedResult(exact, normalized, false);
      }
    }

    const prefix = normalized.slice(0, Math.min(4, normalized.length));
    const candidates = await prisma.youTubeCache.findMany({
      where: {
        OR: [
          { query: { startsWith: prefix } },
          { query: { contains: prefix } },
          ...(normalized.length >= 4
            ? [{ query: { contains: normalized } }]
            : []),
        ],
      },
      orderBy: { lastAccessedAt: "desc" },
      take: 12,
    });

    let best: CachedSearchResult | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const stale = candidate.expiresAt <= new Date();
      if (stale && !options.allowStale) continue;

      const score = scoreAgainstCachedQuery(normalized, candidate.query);
      if (score >= SIMILAR_QUERY_THRESHOLD && score > bestScore) {
        bestScore = score;
        best = toCachedResult(candidate, normalized, candidate.query !== normalized);
      }
    }

    if (best) {
      await touchCachedSearch(best.matchedQuery);
    }

    return best;
  } catch (error) {
    console.warn("[youtube/cache] similar lookup failed:", error);
    return null;
  }
}

export async function resolveCachedSearch(
  query: string,
  options: { allowStale?: boolean } = {},
): Promise<CachedSearchResult | null> {
  const exact = await getCachedSearch(query);
  if (exact && (!exact.stale || options.allowStale)) {
    return exact;
  }

  return findSimilarCachedSearch(query, options);
}

const MIN_SIMILAR_QUERY_LENGTH = 3;
const SIMILAR_QUERY_THRESHOLD = 0.55;

export async function setCachedSearch(
  query: string,
  tracks: MusicTrack[],
  expiresAt: Date,
): Promise<void> {
  const now = new Date();

  try {
    await prisma.youTubeCache.upsert({
      where: { query },
      create: {
        query,
        results: tracks as unknown as Prisma.InputJsonValue,
        expiresAt,
        lastAccessedAt: now,
      },
      update: {
        results: tracks as unknown as Prisma.InputJsonValue,
        expiresAt,
        lastAccessedAt: now,
      },
    });
  } catch (error) {
    console.warn("[youtube/cache] write failed, returning live results:", error);
  }
}

export async function getCachedDiscoveryTracks(limit = 20): Promise<MusicTrack[]> {
  try {
    const rows = await prisma.youTubeCache.findMany({
      orderBy: { lastAccessedAt: "desc" },
      take: 10,
    });

    const seen = new Set<string>();
    const tracks: MusicTrack[] = [];

    for (const row of rows) {
      for (const track of row.results as unknown as MusicTrack[]) {
        if (seen.has(track.videoId)) continue;
        seen.add(track.videoId);
        tracks.push(track);
        if (tracks.length >= limit) return tracks;
      }
    }

    return tracks;
  } catch (error) {
    console.warn("[youtube/cache] discovery read failed:", error);
    return [];
  }
}
