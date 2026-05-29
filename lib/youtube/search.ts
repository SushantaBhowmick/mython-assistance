import "server-only";

import { getServerEnv } from "@/lib/env";
import type { MusicTrack } from "@/types/music";

interface YouTubeSearchItem {
  id: { videoId?: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium?: { url: string };
      default?: { url: string };
      high?: { url: string };
    };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

interface YouTubeVideoItem {
  id: string;
  contentDetails?: {
    duration?: string;
  };
}

interface YouTubeVideosResponse {
  items?: YouTubeVideoItem[];
}

function getThumbnail(item: YouTubeSearchItem): string {
  return (
    item.snippet.thumbnails.medium?.url ??
    item.snippet.thumbnails.high?.url ??
    item.snippet.thumbnails.default?.url ??
    ""
  );
}

function parseIsoDuration(iso?: string): string | null {
  if (!iso) return null;

  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function fetchDurations(videoIds: string[]): Promise<Map<string, string | null>> {
  if (videoIds.length === 0) return new Map();

  const { YOUTUBE_API_KEY } = getServerEnv();
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", YOUTUBE_API_KEY);

  const response = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!response.ok) {
    return new Map();
  }

  const data = (await response.json()) as YouTubeVideosResponse;
  const map = new Map<string, string | null>();

  for (const item of data.items ?? []) {
    map.set(item.id, parseIsoDuration(item.contentDetails?.duration));
  }

  return map;
}

export async function searchYouTube(query: string): Promise<MusicTrack[]> {
  const { YOUTUBE_API_KEY } = getServerEnv();

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10");
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("q", query);
  url.searchParams.set("key", YOUTUBE_API_KEY);

  const response = await fetch(url.toString(), { next: { revalidate: 0 } });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube search failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as YouTubeSearchResponse;
  const items = (data.items ?? []).filter((item) => item.id.videoId);

  const videoIds = items
    .map((item) => item.id.videoId)
    .filter((id): id is string => Boolean(id));

  const durations = await fetchDurations(videoIds);

  return items.map((item) => {
    const videoId = item.id.videoId!;
    return {
      videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: getThumbnail(item),
      duration: durations.get(videoId) ?? null,
      source: "youtube",
    };
  });
}
