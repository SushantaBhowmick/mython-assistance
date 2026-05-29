import { getUserId } from "@/lib/auth/user";
import { jsonOk } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { getCachedDiscoveryTracks } from "@/lib/youtube/cache";
import { prisma, safePrismaRead } from "@/lib/prisma/client";

export async function GET(request: Request) {
  try {
    await getUserId();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 40);

    const [cachedTracks, savedResult] = await Promise.all([
      getCachedDiscoveryTracks(limit * 2),
      safePrismaRead(
        () => prisma.savedTrack.findMany({ select: { videoId: true } }),
        [],
        "discoveries/saved",
      ),
    ]);

    const savedVideoIds = new Set(savedResult.data.map((track) => track.videoId));
    const tracks = cachedTracks
      .filter((track) => !savedVideoIds.has(track.videoId))
      .slice(0, limit);

    return jsonOk({
      tracks,
      cached: true,
      degraded: savedResult.degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[discoveries/get]");
  }
}
