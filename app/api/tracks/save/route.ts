import { getUserId } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/api/response";
import { saveTrackSchema } from "@/lib/music/schemas";
import { upsertSavedTrack } from "@/lib/music/tracks";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = saveTrackSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid track data", 400);
    }

    const userId = await getUserId();
    const track = await upsertSavedTrack(userId, parsed.data);

    return jsonOk({ track }, 201);
  } catch (error) {
    console.error("[tracks/save]", error);
    return jsonError("Failed to save track", 500);
  }
}
