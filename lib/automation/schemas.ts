import { z } from "zod";

export const SUPPORTED_AUTOMATION_EVENTS = [
  "task.create",
  "note.create",
  "reminder.create",
  "transaction.create",
] as const;

export type AutomationEventName = (typeof SUPPORTED_AUTOMATION_EVENTS)[number];

export const automationWebhookSchema = z.object({
  event: z.enum(SUPPORTED_AUTOMATION_EVENTS),
  payload: z.record(z.string(), z.unknown()),
});

export const taskCreatePayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export const noteCreatePayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().max(50000).optional().default(""),
});

export const reminderCreatePayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  remindAt: z.string().datetime({ offset: true }),
});

export const transactionCreatePayloadSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  amount: z.union([z.string(), z.number()]),
  description: z.string().trim().max(500).optional().nullable(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});
