import { getUserId } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma/client";

type RouteContext = {
  params: Promise<{ id: string; trackId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: playlistId, trackId } = await context.params;
    const userId = await getUserId();

    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId },
    });

    if (!playlist) {
      return jsonError("Playlist not found", 404);
    }

    await prisma.playlistTrack.deleteMany({
      where: { playlistId, trackId },
    });

    await prisma.playlist.update({
      where: { id: playlistId },
      data: { updatedAt: new Date() },
    });

    return jsonOk({ success: true });
  } catch (error) {
    console.error("[playlists/id/tracks/delete]", error);
    return jsonError("Failed to remove track from playlist", 500);
  }
}
