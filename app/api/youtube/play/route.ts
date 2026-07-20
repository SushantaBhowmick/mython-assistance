import { handleRouteError } from "@/lib/api/handle-route-error";
import {
  clearCachedUpstreamStream,
  getCachedUpstreamStream,
  resolveYouTubeAudioStream,
} from "@/lib/youtube/stream-resolve";
import { z } from "zod";

const querySchema = z.object({
  videoId: z.string().min(6).max(20),
});

export async function HEAD(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      videoId: searchParams.get("videoId") ?? "",
    });

    if (!parsed.success) {
      return new Response(null, { status: 400 });
    }

    await resolveYouTubeAudioStream(parsed.data.videoId);
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 502 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      videoId: searchParams.get("videoId") ?? "",
    });

    if (!parsed.success) {
      return Response.json({ error: "Invalid video id" }, { status: 400 });
    }

    const { videoId } = parsed.data;
    let stream = getCachedUpstreamStream(videoId) ?? (await resolveYouTubeAudioStream(videoId));

    const range = request.headers.get("range");
    // googlevideo rejects bare fetches — match the iOS client used by stream-resolve.
    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X;)",
      Accept: "*/*",
    };
    if (range) upstreamHeaders.Range = range;

    async function fetchUpstream(url: string) {
      return fetch(url, {
        headers: upstreamHeaders,
        cache: "no-store",
        redirect: "follow",
      });
    }

    let upstream = await fetchUpstream(stream.url);

    // Stale signed URL — re-resolve once and retry.
    if (!upstream.ok && upstream.status !== 206) {
      clearCachedUpstreamStream(videoId);
      stream = await resolveYouTubeAudioStream(videoId);
      upstream = await fetchUpstream(stream.url);
      if (!upstream.ok && upstream.status !== 206) {
        clearCachedUpstreamStream(videoId);
        return Response.json(
          { error: "Upstream stream unavailable" },
          { status: upstream.status === 403 ? 502 : upstream.status },
        );
      }
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      stream.mimeType || upstream.headers.get("content-type") || "audio/mp4",
    );
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "no-store");

    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    return handleRouteError(error, "[youtube/play]");
  }
}
