import { endOfDay, startOfDay, addDays } from "date-fns";
import { ReminderStatus, TaskStatus } from "@prisma/client";

import type { DashboardSummary } from "@/modules/dashboard/types";
import { serializeReminder, reminderInclude, getEffectiveRemindAt } from "@/lib/reminders/serialize";
import { serializeTask } from "@/lib/tasks/serialize";
import { prisma } from "@/lib/prisma/client";

export type { DashboardSummary };

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export async function loadDashboardSummary(userId: string): Promise<DashboardSummary> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(addDays(now, 7));

  const [
    tasksTodayRows,
    tasksOverdueRows,
    remindersRows,
    notesCount,
    bookmarksCount,
    remindersUpcomingCount,
  ] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueAt: { lt: todayStart },
      },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    prisma.reminder.findMany({
      where: {
        userId,
        status: { in: [ReminderStatus.PENDING, ReminderStatus.SNOOZED] },
      },
      include: reminderInclude,
      orderBy: { remindAt: "asc" },
      take: 20,
    }),
    prisma.note.count({ where: { userId } }),
    prisma.bookmark.count({ where: { userId } }),
    prisma.reminder.count({
      where: {
        userId,
        status: { in: [ReminderStatus.PENDING, ReminderStatus.SNOOZED] },
        remindAt: { lte: weekEnd },
      },
    }),
  ]);

  const remindersNext = remindersRows
    .map(serializeReminder)
    .filter((r) => new Date(r.effectiveAt) >= now && new Date(r.effectiveAt) <= weekEnd)
    .slice(0, 5);

  const [tasksTodayCount, tasksOverdueCount] = await Promise.all([
    prisma.task.count({
      where: {
        userId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.task.count({
      where: {
        userId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueAt: { lt: todayStart },
      },
    }),
  ]);

  return {
    greeting: greetingForHour(now.getHours()),
    counts: {
      tasksToday: tasksTodayCount,
      tasksOverdue: tasksOverdueCount,
      notes: notesCount,
      remindersUpcoming: remindersUpcomingCount,
      bookmarks: bookmarksCount,
    },
    tasksToday: tasksTodayRows.map(serializeTask),
    tasksOverdue: tasksOverdueRows.map(serializeTask),
    remindersNext,
  };
}

/** Used by reminder dispatch to find due items */
export async function findDueRemindersForUser(userId: string) {
  const rows = await prisma.reminder.findMany({
    where: {
      userId,
      status: { in: [ReminderStatus.PENDING, ReminderStatus.SNOOZED] },
      notifiedAt: null,
    },
    include: reminderInclude,
  });

  const now = new Date();
  return rows.filter((row) => getEffectiveRemindAt(row) <= now);
}
