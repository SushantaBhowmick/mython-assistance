import { z } from "zod";

const courseStatus = z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]);

export const createCourseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(10_000).optional().nullable(),
  platform: z.string().trim().max(120).optional().nullable(),
  sourceUrl: z.string().url("Source URL must be valid").optional().nullable(),
  status: courseStatus.optional().default("ACTIVE"),
});

export const updateCourseSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(10_000).optional().nullable(),
  platform: z.string().trim().max(120).optional().nullable(),
  sourceUrl: z.string().url("Source URL must be valid").optional().nullable(),
  status: courseStatus.optional(),
});

export const listCoursesQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: courseStatus.optional(),
});

export const createTopicSchema = z.object({
  title: z.string().trim().min(1, "Topic title is required").max(200),
});

export const updateTopicSchema = z.object({
  completed: z.boolean().optional(),
});

export const createStudySessionSchema = z.object({
  courseId: z.string().cuid().optional().nullable(),
  minutes: z.number().int().min(1, "Minutes must be at least 1").max(1440),
  notes: z.string().max(10_000).optional().nullable(),
  studiedAt: z.string().datetime({ offset: true }).optional(),
});

export const listStudySessionsQuerySchema = z.object({
  courseId: z.string().cuid().optional(),
});
