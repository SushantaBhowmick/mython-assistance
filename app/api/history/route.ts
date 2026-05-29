import { getUserId } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/api/response";
import { toSavedTrack } from "@/lib/music/normalize";
import { historySchema } from "@/lib/music/schemas";
import { resolveTrackId } from "@/lib/music/tracks";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = historySchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid history data", 400);
    }

    const userId = await getUserId();
    const trackId = await resolveTrackId(parsed.data.track, parsed.data.trackId);

    const entry = await prisma.listeningHistory.create({
      data: {
        userId,
        trackId,
      },
      include: { track: true },
    });

    return jsonOk(
      {
        entry: {
          id: entry.id,
          playedAt: entry.playedAt.toISOString(),
          track: toSavedTrack(entry.track),
        },
      },
      201,
    );
  } catch (error) {
    console.error("[history/post]", error);
    return jsonError("Failed to record history", 500);
  }
}

export async function GET() {
  try {
    const userId = await getUserId();

    const history = await prisma.listeningHistory.findMany({
      where: { userId },
      include: { track: true },
      orderBy: { playedAt: "desc" },
      take: 50,
    });

    return jsonOk({
      history: history.map((entry) => ({
        id: entry.id,
        playedAt: entry.playedAt.toISOString(),
        track: toSavedTrack(entry.track),
      })),
    });
  } catch (error) {
    console.error("[history/get]", error);
    return jsonError("Failed to load history", 500);
  }
}
