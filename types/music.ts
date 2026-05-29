export type SearchSource = "cache" | "youtube" | "local-fallback";

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
  track: SavedTrack;
  playCount: number;
  firstPlayedAt: string;
  lastPlayedAt: string;
}

export interface YouTubeSearchResponse {
  tracks: MusicTrack[];
  items?: MusicTrack[];
  cached: boolean;
  query: string;
  source?: SearchSource;
  matchedQuery?: string;
  fuzzy?: boolean;
  stale?: boolean;
  quotaExceeded?: boolean;
  message?: string;
}

export interface YouTubeQuotaStatus {
  estimatedSearchCallsToday: number;
  liveSearchDisabled: boolean;
  quotaFallbackActive: boolean;
  lastQuotaErrorAt: string | null;
  liveSearchDisabledUntil: string | null;
  cooldownHours: number;
}

export interface RecommendationItem {
  track: MusicTrack;
  reason: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}
