import { z } from "zod";

const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(20);

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().max(100_000).optional().default(""),
  tags: tagsSchema.optional().default([]),
  pinned: z.boolean().optional().default(false),
});

export const updateNoteSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  body: z.string().max(100_000).optional(),
  tags: tagsSchema.optional(),
  pinned: z.boolean().optional(),
});

export const listNotesQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(40).optional(),
  pinned: z.enum(["true", "false"]).optional(),
});
