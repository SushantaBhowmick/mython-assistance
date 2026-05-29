import { getUserId } from "@/lib/auth/user";
import { jsonOk } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { getRecommendations } from "@/lib/recommendations";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const excludeVideoId = searchParams.get("exclude") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 40);

    const { items, degraded } = await getRecommendations(userId, {
      limit,
      excludeVideoId,
    });

    return jsonOk({ items, degraded: degraded || undefined });
  } catch (error) {
    return handleRouteError(error, "[recommendations/get]");
  }
}
