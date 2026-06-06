import "server-only";

import { ClientType, Innertube } from "youtubei.js";

import { AppError } from "@/lib/errors/app-error";

const PIPED_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.leptons.xyz",
  "https://pipedapi.nosebs.ru",
  "https://api.piped.yt",
];

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://vid.puffyan.us",
];

type PipedStreamResponse = {
  audioStreams?: Array<{
    url: string;
    mimeType?: string;
    bitrate?: number;
  }>;
};

type InvidiousVideoResponse = {
  adaptiveFormats?: Array<{
    url: string;
    type?: string;
    bitrate?: string;
  }>;
};

const RESOLVE_TIMEOUT_MS = 15_000;
const STREAM_CACHE_TTL_MS = 4 * 60 * 60 * 1000;

type CachedStream = {
  url: string;
  mimeType: string;
  expiresAt: number;
};

const streamCache = new Map<string, CachedStream>();

let innertubePromise: Promise<Innertube> | null = null;

async function getInnertube() {
  if (!innertubePromise) {
    innertubePromise = Innertube.create({
      client_type: ClientType.IOS,
      generate_session_locally: true,
      retrieve_player: true,
    });
  }
  return innertubePromise;
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

function pickBestAudioUrl(streams: Array<{ url: string; mimeType?: string; bitrate?: number }>) {
  const audio = streams.filter((s) => s.url && (!s.mimeType || s.mimeType.includes("audio")));
  const ranked = (audio.length > 0 ? audio : streams).slice().sort((a, b) => {
    return (b.bitrate ?? 0) - (a.bitrate ?? 0);
  });
  return ranked[0] ?? null;
}

async function resolveFromYoutubei(videoId: string) {
  const yt = await getInnertube();
  const info = await yt.getBasicInfo(videoId);
  const format = info.chooseFormat({
    type: "audio",
    quality: "best",
    client: "IOS",
  });

  if (!format) return null;

  const url = await format.decipher(yt.session.player);
  if (!url || typeof url !== "string") return null;

  return {
    url,
    mimeType: format.mime_type ?? "audio/mp4",
  };
}

async function resolveFromPiped(videoId: string) {
  for (const instance of PIPED_INSTANCES) {
    try {
      const response = await fetchWithTimeout(`${instance}/streams/${videoId}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) continue;

      const data = (await response.json()) as PipedStreamResponse;
      const picked = pickBestAudioUrl(
        (data.audioStreams ?? []).map((stream) => ({
          url: stream.url,
          mimeType: stream.mimeType,
          bitrate: stream.bitrate,
        })),
      );

      if (picked?.url) {
        return {
          url: picked.url,
          mimeType: picked.mimeType ?? "audio/mp4",
        };
      }
    } catch {
      // Try next instance.
    }
  }

  return null;
}

async function resolveFromInvidious(videoId: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetchWithTimeout(`${instance}/api/v1/videos/${videoId}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) continue;

      const data = (await response.json()) as InvidiousVideoResponse;
      const picked = pickBestAudioUrl(
        (data.adaptiveFormats ?? [])
          .filter((format) => format.url)
          .map((format) => ({
            url: format.url,
            mimeType: format.type,
            bitrate: format.bitrate ? Number(format.bitrate) : undefined,
          })),
      );

      if (picked?.url) {
        return {
          url: picked.url,
          mimeType: picked.mimeType ?? "audio/mp4",
        };
      }
    } catch {
      // Try next instance.
    }
  }

  return null;
}

export function getCachedUpstreamStream(videoId: string) {
  const cached = streamCache.get(videoId);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    streamCache.delete(videoId);
    return null;
  }
  return cached;
}

export function clearCachedUpstreamStream(videoId: string) {
  streamCache.delete(videoId);
}

/** Resolve upstream audio URL. Cached server-side for proxy playback. */
export async function resolveYouTubeAudioStream(videoId: string) {
  const cached = getCachedUpstreamStream(videoId);
  if (cached) return cached;

  const resolvers = [resolveFromYoutubei, resolveFromPiped, resolveFromInvidious];

  for (const resolve of resolvers) {
    try {
      const resolved = await resolve(videoId);
      if (!resolved?.url) continue;

      const entry: CachedStream = {
        url: resolved.url,
        mimeType: resolved.mimeType,
        expiresAt: Date.now() + STREAM_CACHE_TTL_MS,
      };
      streamCache.set(videoId, entry);
      return entry;
    } catch (error) {
      console.warn("[youtube/stream-resolve]", resolve.name, videoId, error);
    }
  }

  throw new AppError(
    "Could not resolve an audio stream for this video",
    502,
    "STREAM_UNAVAILABLE",
  );
}
