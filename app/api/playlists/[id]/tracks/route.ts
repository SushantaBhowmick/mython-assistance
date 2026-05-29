import { getUserId } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/api/response";
import { addPlaylistTrackSchema } from "@/lib/music/schemas";
import { resolveTrackId } from "@/lib/music/tracks";
import { prisma } from "@/lib/prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: playlistId } = await context.params;
    const userId = await getUserId();

    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId },
    });

    if (!playlist) {
      return jsonError("Playlist not found", 404);
    }

    const body = await request.json();
    const parsed = addPlaylistTrackSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid track data", 400);
    }

    const trackId = await resolveTrackId(parsed.data.track, parsed.data.trackId);

    const existingCount = await prisma.playlistTrack.count({
      where: { playlistId },
    });

    const entry = await prisma.playlistTrack.upsert({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
      create: {
        playlistId,
        trackId,
        position: existingCount,
      },
      update: {},
      include: { track: true },
    });

    await prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    });

    const { toSavedTrack } = await import("@/lib/music/normalize");

    return jsonOk({ track: toSavedTrack(entry.track) }, 201);
  } catch (error) {
    console.error("[playlists/id/tracks/post]", error);
    return jsonError("Failed to add track to playlist", 500);
  }
}
