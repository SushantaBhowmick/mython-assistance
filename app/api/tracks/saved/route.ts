import { getUserId } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/api/response";
import { toSavedTrack } from "@/lib/music/normalize";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  try {
    const userId = await getUserId();

    const tracks = await prisma.savedTrack.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ tracks: tracks.map(toSavedTrack) });
  } catch (error) {
    console.error("[tracks/saved]", error);
    return jsonError("Failed to load saved tracks", 500);
  }
}
