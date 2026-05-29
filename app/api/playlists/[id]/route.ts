import { getUserId } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/api/response";
import { toSavedTrack } from "@/lib/music/normalize";
import { prisma } from "@/lib/prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getUserId();

    const playlist = await prisma.playlist.findFirst({
      where: { id, userId },
      include: {
        tracks: {
          include: { track: true },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!playlist) {
      return jsonError("Playlist not found", 404);
    }

    return jsonOk({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        coverImage: playlist.coverImage,
        createdAt: playlist.createdAt.toISOString(),
        updatedAt: playlist.updatedAt.toISOString(),
        tracks: playlist.tracks.map((entry) => toSavedTrack(entry.track)),
      },
    });
  } catch (error) {
    console.error("[playlists/id/get]", error);
    return jsonError("Failed to load playlist", 500);
  }
}
