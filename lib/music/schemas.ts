import { z } from "zod";

export const musicTrackInputSchema = z.object({
  videoId: z.string().min(1),
  title: z.string().min(1),
  channelTitle: z.string().min(1),
  thumbnailUrl: z.string().min(1),
  duration: z.string().nullable().optional(),
  source: z.string().optional(),
});

export const saveTrackSchema = musicTrackInputSchema;

export const favoriteSchema = z.object({
  trackId: z.string().min(1),
});

export const createPlaylistSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  coverImage: z.string().url().optional(),
});

export const addPlaylistTrackSchema = z.object({
  track: musicTrackInputSchema.optional(),
  trackId: z.string().min(1).optional(),
}).refine((data) => data.track || data.trackId, {
  message: "Either track or trackId is required",
});

export const historySchema = z.object({
  track: musicTrackInputSchema.optional(),
  trackId: z.string().min(1).optional(),
}).refine((data) => data.track || data.trackId, {
  message: "Either track or trackId is required",
});
