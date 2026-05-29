import { getUserId } from "@/lib/auth/user";
import { prisma } from "@/lib/prisma/client";
import type { MusicTrack } from "@/types/music";
import { toSavedTrack } from "@/lib/music/normalize";
import { warmSearchCacheFromTrack } from "@/lib/youtube/cache-warm";
import type { musicTrackInputSchema } from "@/lib/music/schemas";
import type { z } from "zod";

type TrackInput = z.infer<typeof musicTrackInputSchema>;

export async function upsertSavedTrack(
  userId: string,
  track: TrackInput | MusicTrack,
) {
  const saved = await prisma.savedTrack.upsert({
    where: {
      userId_videoId: {
        userId,
        videoId: track.videoId,
      },
    },
    create: {
      userId,
      videoId: track.videoId,
      title: track.title,
      channelTitle: track.channelTitle,
      thumbnailUrl: track.thumbnailUrl,
      duration: track.duration ?? null,
      source: track.source ?? "youtube",
    },
    update: {
      title: track.title,
      channelTitle: track.channelTitle,
      thumbnailUrl: track.thumbnailUrl,
      duration: track.duration ?? null,
    },
  });

  const savedTrack = toSavedTrack(saved);
  await warmSearchCacheFromTrack(savedTrack);

  return savedTrack;
}

export async function resolveTrackId(
  track?: TrackInput | MusicTrack,
  trackId?: string,
): Promise<string> {
  if (trackId) return trackId;
  if (!track) {
    throw new Error("Track metadata or trackId is required");
  }

  const userId = await getUserId();
  const saved = await upsertSavedTrack(userId, track);
  return saved.id;
}
