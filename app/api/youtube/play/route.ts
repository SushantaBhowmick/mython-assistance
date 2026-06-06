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
    const cached = getCachedUpstreamStream(videoId) ?? (await resolveYouTubeAudioStream(videoId));

    const range = request.headers.get("range");
    const upstream = await fetch(cached.url, {
      headers: range ? { Range: range } : undefined,
      cache: "no-store",
    });

    if (!upstream.ok && upstream.status !== 206) {
      clearCachedUpstreamStream(videoId);
      return Response.json(
        { error: "Upstream stream unavailable" },
        { status: upstream.status === 403 ? 502 : upstream.status },
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", cached.mimeType || upstream.headers.get("content-type") || "audio/mp4");
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
