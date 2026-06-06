import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonOk } from "@/lib/api/response";
import { resolveYouTubeAudioStream } from "@/lib/youtube/stream-resolve";
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

    const url = await resolveYouTubeAudioStream(parsed.data.videoId);

    return jsonOk({
      url,
      // Stream URLs expire; client should refresh on playback errors.
      expiresAt: Date.now() + 5 * 60 * 60 * 1000,
    });
  } catch (error) {
    return handleRouteError(error, "[youtube/stream]");
  }
}
