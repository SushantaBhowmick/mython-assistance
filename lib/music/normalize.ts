import type { MusicTrack } from "@/types/music";
import type { SavedTrack as PrismaSavedTrack } from "@prisma/client";

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export const MIN_SEARCH_QUERY_LENGTH = 3;
export const CACHE_EXPIRY_DAYS = 90;

export function getCacheExpiryDate(from = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + CACHE_EXPIRY_DAYS);
  return expiresAt;
}

export function toMusicTrack(track: PrismaSavedTrack): MusicTrack & { id: string } {
  return {
    id: track.id,
    videoId: track.videoId,
    title: track.title,
    channelTitle: track.channelTitle,
    thumbnailUrl: track.thumbnailUrl,
    duration: track.duration,
    source: track.source,
  };
}

export function toSavedTrack(track: PrismaSavedTrack) {
  return {
    ...toMusicTrack(track),
    createdAt: track.createdAt.toISOString(),
    updatedAt: track.updatedAt.toISOString(),
  };
}
