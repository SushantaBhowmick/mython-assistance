import { z } from "zod";

const taskStatus = z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]);
const taskPriority = z.enum(["LOW", "MEDIUM", "HIGH"]);

const dueAtSchema = z
  .string()
  .datetime({ offset: true })
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(10_000).optional().nullable(),
  status: taskStatus.optional().default("TODO"),
  priority: taskPriority.optional().default("MEDIUM"),
  dueAt: dueAtSchema,
  projectTag: z.string().trim().max(80).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(10_000).optional().nullable(),
  status: taskStatus.optional(),
  priority: taskPriority.optional(),
  dueAt: dueAtSchema,
  projectTag: z.string().trim().max(80).optional().nullable(),
});

export const listTasksQuerySchema = z.object({
  filter: z.enum(["all", "today", "upcoming", "done", "overdue"]).optional().default("all"),
  q: z.string().trim().max(100).optional(),
});
