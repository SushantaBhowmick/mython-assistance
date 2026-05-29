import type { YouTubeSearchResponse } from "@/types/music";

const memoryCache = new Map<string, YouTubeSearchResponse>();

export function getClientSearchCache(query: string): YouTubeSearchResponse | null {
  const key = query.trim().toLowerCase();
  return memoryCache.get(key) ?? null;
}

export function setClientSearchCache(query: string, response: YouTubeSearchResponse) {
  const key = query.trim().toLowerCase();
  memoryCache.set(key, response);

  if (memoryCache.size > 50) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
}

export function clearClientSearchCache() {
  memoryCache.clear();
}
