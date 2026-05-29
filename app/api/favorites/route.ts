import { getUserId } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/api/response";
import { toSavedTrack } from "@/lib/music/normalize";
import { favoriteSchema } from "@/lib/music/schemas";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

export async function GET() {
  try {
    const userId = await getUserId();

    const { data: favorites, degraded } = await safePrismaRead(
      () =>
        prisma.favorite.findMany({
          where: { userId },
          include: { track: true },
          orderBy: { createdAt: "desc" },
        }),
      [],
      "favorites/list",
    );

    return jsonOk({
      favorites: favorites.map((favorite) => ({
        id: favorite.id,
        createdAt: favorite.createdAt.toISOString(),
        track: toSavedTrack(favorite.track),
      })),
      degraded: degraded || undefined,
    });
  } catch (error) {
    console.error("[favorites/get]", error);
    return jsonError("Failed to load favorites", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = favoriteSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid favorite data", 400);
    }

    const userId = await getUserId();

    const track = await prisma.savedTrack.findFirst({
      where: { id: parsed.data.trackId, userId },
    });

    if (!track) {
      return jsonError("Track not found", 404);
    }

    const favorite = await withPrismaRetry(
      () =>
        prisma.favorite.upsert({
          where: {
            userId_trackId: {
              userId,
              trackId: parsed.data.trackId,
            },
          },
          create: {
            userId,
            trackId: parsed.data.trackId,
          },
          update: {},
          include: { track: true },
        }),
      { label: "favorites/upsert" },
    );

    return jsonOk(
      {
        favorite: {
          id: favorite.id,
          createdAt: favorite.createdAt.toISOString(),
          track: toSavedTrack(favorite.track),
        },
      },
      201,
    );
  } catch (error) {
    console.error("[favorites/post]", error);
    return jsonError("Failed to add favorite", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const parsed = favoriteSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid favorite data", 400);
    }

    const userId = await getUserId();

    await prisma.favorite.deleteMany({
      where: {
        userId,
        trackId: parsed.data.trackId,
      },
    });

    return jsonOk({ success: true });
  } catch (error) {
    console.error("[favorites/delete]", error);
    return jsonError("Failed to remove favorite", 500);
  }
}
