import type {
  HistoryEntry,
  MusicTrack,
  PlaylistDetail,
  PlaylistSummary,
  SavedTrack,
  YouTubeSearchResponse,
} from "@/types/music";

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

export async function searchMusic(query: string): Promise<YouTubeSearchResponse> {
  const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
  return parseJson<YouTubeSearchResponse>(response);
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

export async function getHistory(): Promise<{ history: HistoryEntry[] }> {
  const response = await fetch("/api/history");
  return parseJson(response);
}
