import "server-only";

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://api.piped.private.coffee",
  "https://pipedapi.adminforge.de",
];

const INVIDIOUS_INSTANCES = [
  "https://yewtu.be",
  "https://invidious.fdn.fr",
  "https://inv.nadeko.net",
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

const RESOLVE_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
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
  return ranked[0]?.url ?? null;
}

async function resolveFromPiped(videoId: string) {
  for (const instance of PIPED_INSTANCES) {
    try {
      const response = await fetchWithTimeout(`${instance}/streams/${videoId}`);
      if (!response.ok) continue;

      const data = (await response.json()) as PipedStreamResponse;
      const url = pickBestAudioUrl(
        (data.audioStreams ?? []).map((stream) => ({
          url: stream.url,
          mimeType: stream.mimeType,
          bitrate: stream.bitrate,
        })),
      );

      if (url) return url;
    } catch {
      // Try next instance.
    }
  }

  return null;
}

async function resolveFromInvidious(videoId: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetchWithTimeout(`${instance}/api/v1/videos/${videoId}`);
      if (!response.ok) continue;

      const data = (await response.json()) as InvidiousVideoResponse;
      const url = pickBestAudioUrl(
        (data.adaptiveFormats ?? [])
          .filter((format) => format.url)
          .map((format) => ({
            url: format.url,
            mimeType: format.type,
            bitrate: format.bitrate ? Number(format.bitrate) : undefined,
          })),
      );

      if (url) return url;
    } catch {
      // Try next instance.
    }
  }

  return null;
}

/** Resolve a browser-playable audio URL for a YouTube video (Spotify-style direct stream). */
export async function resolveYouTubeAudioStream(videoId: string) {
  const pipedUrl = await resolveFromPiped(videoId);
  if (pipedUrl) return pipedUrl;

  const invidiousUrl = await resolveFromInvidious(videoId);
  if (invidiousUrl) return invidiousUrl;

  throw new Error("Could not resolve an audio stream for this video");
}
