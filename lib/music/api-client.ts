import type {
  HistoryEntry,
  MusicTrack,
  PlaylistDetail,
  PlaylistSummary,
  RecommendationItem,
  SavedTrack,
  YouTubeQuotaStatus,
  YouTubeSearchResponse,
} from "@/types/music";

import {
  getClientSearchCache,
  setClientSearchCache,
} from "@/lib/music/search-client-cache";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string; code?: string };
  if (!response.ok) {
    throw new ApiClientError(
      data.error ?? "Request failed",
      response.status,
      data.code,
    );
  }
  return data;
}

let searchInFlight = new Map<string, Promise<YouTubeSearchResponse>>();
const streamInFlight = new Map<string, Promise<{ url: string; expiresAt: number }>>();

export async function fetchStreamUrl(videoId: string) {
  const cached = streamInFlight.get(videoId);
  if (cached) return cached;

  const promise = (async () => {
    const response = await fetch(`/api/youtube/stream?videoId=${encodeURIComponent(videoId)}`, {
      cache: "no-store",
    });
    return parseJson<{ url: string; expiresAt: number }>(response);
  })();

  streamInFlight.set(videoId, promise);

  try {
    return await promise;
  } finally {
    streamInFlight.delete(videoId);
  }
}

export async function searchMusic(
  query: string,
  signal?: AbortSignal,
): Promise<YouTubeSearchResponse> {
  const trimmed = query.trim();
  const normalized = trimmed.toLowerCase();

  const cached = getClientSearchCache(normalized);
  if (cached) {
    return cached;
  }

  const pending = searchInFlight.get(normalized);
  if (pending) {
    return pending;
  }

  const promise = fetch(`/api/youtube/search?q=${encodeURIComponent(trimmed)}`, {
    signal,
  })
    .then((response) => parseJson<YouTubeSearchResponse>(response))
    .then((result) => {
      setClientSearchCache(normalized, result);
      return result;
    })
    .finally(() => {
      searchInFlight.delete(normalized);
    });

  searchInFlight.set(normalized, promise);
  return promise;
}

export async function getYouTubeQuotaStatus(): Promise<YouTubeQuotaStatus> {
  const response = await fetch("/api/youtube/quota-status");
  return parseJson(response);
}

export async function saveTrack(track: MusicTrack): Promise<{ track: SavedTrack }> {
  const response = await fetch("/api/tracks/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(track),
  });
  return parseJson(response);
}

export async function getSavedTracks(): Promise<{ tracks: SavedTrack[] }> {
  const response = await fetch("/api/tracks/saved");
  return parseJson(response);
}

export async function getFavorites(): Promise<{
  favorites: { id: string; createdAt: string; track: SavedTrack }[];
}> {
  const response = await fetch("/api/favorites");
  return parseJson(response);
}

export async function addFavorite(trackId: string) {
  const response = await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackId }),
  });
  return parseJson(response);
}

export async function removeFavorite(trackId: string) {
  const response = await fetch("/api/favorites", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackId }),
  });
  return parseJson(response);
}

export async function getPlaylists(): Promise<{ playlists: PlaylistSummary[] }> {
  const response = await fetch("/api/playlists");
  return parseJson(response);
}

export async function createPlaylist(input: {
  name: string;
  description?: string;
}): Promise<{ playlist: PlaylistSummary }> {
  const response = await fetch("/api/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson(response);
}

export async function getPlaylist(id: string): Promise<{ playlist: PlaylistDetail }> {
  const response = await fetch(`/api/playlists/${id}`);
  return parseJson(response);
}

export async function addTrackToPlaylist(
  playlistId: string,
  input: { track?: MusicTrack; trackId?: string },
) {
  const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson(response);
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  const response = await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, {
    method: "DELETE",
  });
  return parseJson(response);
}

export async function recordHistory(input: { track?: MusicTrack; trackId?: string }) {
  const response = await fetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<{ entry: HistoryEntry }>(response);
}

export async function getHistory(options?: {
  sort?: "recent" | "most-played";
  limit?: number;
}): Promise<{ history: HistoryEntry[] }> {
  const params = new URLSearchParams();
  if (options?.sort) params.set("sort", options.sort);
  if (options?.limit) params.set("limit", String(options.limit));
  const query = params.toString();
  const response = await fetch(`/api/history${query ? `?${query}` : ""}`);
  return parseJson(response);
}

export async function getRecommendations(options?: {
  limit?: number;
  exclude?: string;
}): Promise<{ items: RecommendationItem[] }> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.exclude) params.set("exclude", options.exclude);
  const query = params.toString();
  const response = await fetch(`/api/recommendations${query ? `?${query}` : ""}`);
  return parseJson(response);
}

export async function getDiscoveries(limit = 20): Promise<{ tracks: MusicTrack[]; cached: boolean }> {
  const response = await fetch(`/api/discoveries?limit=${limit}`);
  return parseJson(response);
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
