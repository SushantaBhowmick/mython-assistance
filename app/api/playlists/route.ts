import { getUserId } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createPlaylistSchema } from "@/lib/music/schemas";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  try {
    const userId = await getUserId();

    const playlists = await prisma.playlist.findMany({
      where: { userId },
      include: {
        _count: { select: { tracks: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return jsonOk({
      playlists: playlists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        coverImage: playlist.coverImage,
        trackCount: playlist._count.tracks,
        createdAt: playlist.createdAt.toISOString(),
        updatedAt: playlist.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[playlists/get]", error);
    return jsonError("Failed to load playlists", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createPlaylistSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid playlist data", 400);
    }

    const userId = await getUserId();

    const playlist = await prisma.playlist.create({
      data: {
        userId,
        name: parsed.data.name,
        description: parsed.data.description,
        coverImage: parsed.data.coverImage,
      },
      include: {
        _count: { select: { tracks: true } },
      },
    });

    return jsonOk(
      {
        playlist: {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          coverImage: playlist.coverImage,
          trackCount: playlist._count.tracks,
          createdAt: playlist.createdAt.toISOString(),
          updatedAt: playlist.updatedAt.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    console.error("[playlists/post]", error);
    return jsonError("Failed to create playlist", 500);
  }
}
