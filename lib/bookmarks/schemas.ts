import { z } from "zod";

export const createBookmarkSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  url: z.string().trim().url("Valid URL is required").max(2000),
  description: z.string().trim().max(2000).optional().nullable(),
  noteId: z.string().cuid().optional().nullable(),
});

export const updateBookmarkSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  url: z.string().trim().url().max(2000).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  noteId: z.string().cuid().optional().nullable(),
});

export const listBookmarksQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
});
