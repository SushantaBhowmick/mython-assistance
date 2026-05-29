import { getUserId } from "@/lib/auth/user";
import { AppError } from "@/lib/errors/app-error";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonOk } from "@/lib/api/response";
import { toSavedTrack } from "@/lib/music/normalize";
import { historySchema } from "@/lib/music/schemas";
import { resolveTrackId } from "@/lib/music/tracks";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = historySchema.safeParse(body);

    if (!parsed.success) {
      return handleRouteError(
        new AppError(parsed.error.issues[0]?.message ?? "Invalid history data", 400),
        "[history/post]",
      );
    }

    const userId = await getUserId();
    const trackId = await resolveTrackId(parsed.data.track, parsed.data.trackId);
    const now = new Date();

    const [entry, stats] = await withPrismaRetry(
      () =>
        prisma.$transaction(async (tx) => {
          const historyEntry = await tx.listeningHistory.create({
            data: { userId, trackId },
            include: { track: true },
          });

          const trackStats = await tx.trackStats.upsert({
            where: { userId_trackId: { userId, trackId } },
            create: {
              userId,
              trackId,
              playCount: 1,
              firstPlayedAt: now,
              lastPlayedAt: now,
            },
            update: {
              playCount: { increment: 1 },
              lastPlayedAt: now,
            },
          });

          return [historyEntry, trackStats] as const;
        }),
      { label: "history/post" },
    );

    return jsonOk(
      {
        entry: {
          id: entry.id,
          playedAt: entry.playedAt.toISOString(),
          track: toSavedTrack(entry.track),
          playCount: stats.playCount,
          firstPlayedAt: stats.firstPlayedAt.toISOString(),
          lastPlayedAt: stats.lastPlayedAt.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error, "[history/post]");
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") ?? "recent";
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

    const { data: stats, degraded } = await safePrismaRead(
      () =>
        prisma.trackStats.findMany({
          where: { userId },
          include: { track: true },
          orderBy:
            sort === "most-played"
              ? [{ playCount: "desc" }, { lastPlayedAt: "desc" }]
              : [{ lastPlayedAt: "desc" }],
          take: limit,
        }),
      [],
      "history/list",
    );

    return jsonOk({
      history: stats.map((item) => ({
        track: toSavedTrack(item.track),
        playCount: item.playCount,
        firstPlayedAt: item.firstPlayedAt.toISOString(),
        lastPlayedAt: item.lastPlayedAt.toISOString(),
      })),
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[history/get]");
  }
}
