import "server-only";

import { normalizeSearchQuery, toMusicTrack } from "@/lib/music/normalize";
import { prisma, safePrismaRead } from "@/lib/prisma/client";
import type { MusicTrack } from "@/types/music";

function scoreTrack(query: string, track: MusicTrack): number {
  const title = track.title.toLowerCase();
  const channel = track.channelTitle.toLowerCase();

  if (title.includes(query) || channel.includes(query)) return 100;
  if (query.includes(title) || query.includes(channel)) return 80;

  const words = query.split(/\s+/).filter(Boolean);
  let hits = 0;
  for (const word of words) {
    if (title.includes(word) || channel.includes(word)) hits++;
  }

  return hits > 0 ? 50 + hits * 10 : 0;
}

function dedupeTracks(tracks: MusicTrack[]): MusicTrack[] {
  const seen = new Set<string>();
  const result: MusicTrack[] = [];

  for (const track of tracks) {
    if (seen.has(track.videoId)) continue;
    seen.add(track.videoId);
    result.push(track);
  }

  return result;
}

export async function searchLocalMusic(
  userId: string,
  rawQuery: string,
  limit = 20,
): Promise<MusicTrack[]> {
  const query = normalizeSearchQuery(rawQuery);
  if (query.length < 3) return [];

  const [savedResult, cacheResult, favoriteResult, statResult] = await Promise.all([
    safePrismaRead(
      () =>
        prisma.savedTrack.findMany({
          where: {
            userId,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { channelTitle: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 40,
        }),
      [],
      "local-search/saved",
    ),
    safePrismaRead(
      () =>
        prisma.youTubeCache.findMany({
          where: {
            OR: [
              { query: { contains: query, mode: "insensitive" } },
              { query: { startsWith: query.slice(0, Math.min(4, query.length)) } },
            ],
          },
          orderBy: { lastAccessedAt: "desc" },
          take: 8,
        }),
      [],
      "local-search/cache",
    ),
    safePrismaRead(
      () =>
        prisma.favorite.findMany({
          where: { userId },
          include: { track: true },
          take: 40,
        }),
      [],
      "local-search/favorites",
    ),
    safePrismaRead(
      () =>
        prisma.trackStats.findMany({
          where: { userId },
          include: { track: true },
          orderBy: { lastPlayedAt: "desc" },
          take: 40,
        }),
      [],
      "local-search/stats",
    ),
  ]);

  const scored: Array<{ track: MusicTrack; score: number }> = [];

  function add(track: MusicTrack, bonus = 0) {
    const score = scoreTrack(query, track) + bonus;
    if (score <= 0) return;
    scored.push({ track, score });
  }

  for (const track of savedResult.data) {
    add(toMusicTrack(track), 20);
  }

  for (const row of favoriteResult.data) {
    add(toMusicTrack(row.track), 15);
  }

  for (const row of statResult.data) {
    add(toMusicTrack(row.track), 10);
  }

  for (const row of cacheResult.data) {
    for (const track of row.results as unknown as MusicTrack[]) {
      add(track, row.query.includes(query) ? 12 : 5);
    }
  }

  return dedupeTracks(
    scored.sort((a, b) => b.score - a.score).map((item) => item.track),
  ).slice(0, limit);
}

export { dedupeTracks };
