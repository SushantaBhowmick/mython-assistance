import { z } from "zod";

const reminderStatus = z.enum(["PENDING", "DONE", "SNOOZED"]);

export const createReminderSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  remindAt: z.string().datetime({ offset: true }),
  status: reminderStatus.optional().default("PENDING"),
  taskId: z.string().cuid().optional().nullable(),
  noteId: z.string().cuid().optional().nullable(),
});

export const updateReminderSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  remindAt: z.string().datetime({ offset: true }).optional(),
  status: reminderStatus.optional(),
  snoozedUntil: z.string().datetime({ offset: true }).optional().nullable(),
  taskId: z.string().cuid().optional().nullable(),
  noteId: z.string().cuid().optional().nullable(),
});

export const listRemindersQuerySchema = z.object({
  filter: z.enum(["upcoming", "pending", "done", "all"]).optional().default("upcoming"),
});
