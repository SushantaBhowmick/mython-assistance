import { getServerEnv } from "@/lib/env";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { handleYouTubeSearchRequest } from "@/lib/youtube/search-handler";

export async function GET(request: Request) {
  try {
    getServerEnv();

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q") ?? "";

    const result = await handleYouTubeSearchRequest(rawQuery);
    return Response.json(result);
  } catch (error) {
    return handleRouteError(error, "[youtube/search]");
  }
}
