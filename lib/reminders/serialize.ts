import type { ReminderDetail, ReminderSummary } from "@/modules/reminders/types";
import { ReminderStatus, type Prisma, type Reminder } from "@prisma/client";

type ReminderWithLinks = Reminder & {
  task?: { id: string; title: string } | null;
  note?: { id: string; title: string } | null;
};

export function getEffectiveRemindAt(row: Reminder): Date {
  if (row.status === "SNOOZED" && row.snoozedUntil) {
    return row.snoozedUntil;
  }
  return row.remindAt;
}

export function serializeReminder(row: ReminderWithLinks): ReminderSummary {
  const effective = getEffectiveRemindAt(row);

  return {
    id: row.id,
    title: row.title,
    remindAt: row.remindAt.toISOString(),
    status: row.status,
    snoozedUntil: row.snoozedUntil?.toISOString() ?? null,
    effectiveAt: effective.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    link: {
      taskId: row.taskId,
      noteId: row.noteId,
      taskTitle: row.task?.title ?? null,
      noteTitle: row.note?.title ?? null,
    },
  };
}

export function serializeReminderDetail(row: ReminderWithLinks): ReminderDetail {
  return serializeReminder(row);
}

export const reminderInclude = {
  task: { select: { id: true, title: true } },
  note: { select: { id: true, title: true } },
} satisfies Prisma.ReminderInclude;

export function buildReminderListWhere(
  userId: string,
  filter: "upcoming" | "pending" | "done" | "all",
): Prisma.ReminderWhereInput {
  const base: Prisma.ReminderWhereInput = { userId };

  switch (filter) {
    case "done":
      return { ...base, status: ReminderStatus.DONE };
    case "pending":
      return {
        ...base,
        status: { in: [ReminderStatus.PENDING, ReminderStatus.SNOOZED] },
      };
    case "all":
      return base;
    default:
      return {
        ...base,
        status: { in: [ReminderStatus.PENDING, ReminderStatus.SNOOZED] },
      };
  }
}
