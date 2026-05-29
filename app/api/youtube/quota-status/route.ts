import { jsonOk } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { getYouTubeQuotaStatusForApi } from "@/lib/youtube/search-handler";

export async function GET() {
  try {
    const status = await getYouTubeQuotaStatusForApi();
    return jsonOk(status);
  } catch (error) {
    return handleRouteError(error, "[youtube/quota-status]");
  }
}
