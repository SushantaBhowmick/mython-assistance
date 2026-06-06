import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonOk } from "@/lib/api/response";
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

    // Return immediately — /api/youtube/play resolves the upstream stream on demand.
    return jsonOk({
      url: `/api/youtube/play?videoId=${encodeURIComponent(videoId)}`,
      mimeType: "audio/mp4",
      expiresAt: Date.now() + 4 * 60 * 60 * 1000,
    });
  } catch (error) {
    return handleRouteError(error, "[youtube/stream]");
  }
}
