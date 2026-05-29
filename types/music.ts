export interface MusicTrack {
  id?: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string | null;
  source?: string;
}

export interface SavedTrack extends MusicTrack {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistSummary {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistDetail extends Omit<PlaylistSummary, "trackCount"> {
  tracks: SavedTrack[];
}

export interface HistoryEntry {
  id: string;
  playedAt: string;
  track: SavedTrack;
}

export interface YouTubeSearchResponse {
  tracks: MusicTrack[];
  cached: boolean;
  query: string;
}

export interface ApiErrorResponse {
  error: string;
}
