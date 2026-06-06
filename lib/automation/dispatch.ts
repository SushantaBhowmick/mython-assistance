import "server-only";

import { addHours } from "date-fns";

import {
  automationWebhookSchema,
  noteCreatePayloadSchema,
  reminderCreatePayloadSchema,
  taskCreatePayloadSchema,
  transactionCreatePayloadSchema,
  type AutomationEventName,
} from "@/lib/automation/schemas";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

export type AutomationDispatchResult =
  | { ok: true; event: AutomationEventName; resourceId?: string; href: string }
  | { ok: false; event: AutomationEventName; error: string };

export async function dispatchAutomationEvent(
  userId: string,
  input: unknown,
): Promise<AutomationDispatchResult> {
  const parsed = automationWebhookSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      event: "task.create",
      error: parsed.error.issues[0]?.message ?? "Invalid webhook payload",
    };
  }

  const { event, payload } = parsed.data;

  try {
    switch (event) {
      case "task.create": {
        const data = taskCreatePayloadSchema.parse(payload);
        const task = await withPrismaRetry(() =>
          prisma.task.create({
            data: {
              userId,
              title: data.title,
              description: data.description ?? null,
              priority: data.priority ?? "MEDIUM",
            },
          }),
        );
        return { ok: true, event, resourceId: task.id, href: `/tasks/${task.id}` };
      }

      case "note.create": {
        const data = noteCreatePayloadSchema.parse(payload);
        const note = await withPrismaRetry(() =>
          prisma.note.create({
            data: {
              userId,
              title: data.title,
              body: data.body ?? "",
            },
          }),
        );
        return { ok: true, event, resourceId: note.id, href: `/notes/${note.id}` };
      }

      case "reminder.create": {
        const data = reminderCreatePayloadSchema.parse(payload);
        const reminder = await withPrismaRetry(() =>
          prisma.reminder.create({
            data: {
              userId,
              title: data.title,
              remindAt: new Date(data.remindAt),
            },
          }),
        );
        return { ok: true, event, resourceId: reminder.id, href: "/reminders" };
      }

      case "transaction.create": {
        const data = transactionCreatePayloadSchema.parse(payload);
        const amount =
          typeof data.amount === "number" ? data.amount.toFixed(2) : String(data.amount);
        const tx = await withPrismaRetry(() =>
          prisma.transaction.create({
            data: {
              userId,
              type: data.type,
              amount,
              description: data.description ?? null,
              occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
            },
          }),
        );
        return { ok: true, event, resourceId: tx.id, href: "/finance" };
      }

      default:
        return { ok: false, event, error: "Unsupported event" };
    }
  } catch (error) {
    return {
      ok: false,
      event,
      error: error instanceof Error ? error.message : "Dispatch failed",
    };
  }
}

/** Default remindAt for automation when omitted — 1 hour from now */
export function defaultRemindAtIso() {
  return addHours(new Date(), 1).toISOString();
}
