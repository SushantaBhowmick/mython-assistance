import "server-only";

import { prisma } from "@/lib/prisma/client";

export async function upsertTrackStats(userId: string, trackId: string) {
  const now = new Date();

  return prisma.trackStats.upsert({
    where: {
      userId_trackId: { userId, trackId },
    },
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
}
