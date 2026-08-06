import { endOfDay, startOfDay, addDays } from "date-fns";
import { ReminderStatus, TaskStatus } from "@prisma/client";

import type { DashboardSummary } from "@/modules/dashboard/types";
import { serializeNoteSummary } from "@/lib/notes/serialize";
import { isNotesUnlocked } from "@/lib/notes/vault";
import { serializeReminder, reminderInclude, getEffectiveRemindAt } from "@/lib/reminders/serialize";
import { serializeTask } from "@/lib/tasks/serialize";
import { prisma } from "@/lib/prisma/client";
import { CourseStatus, ApplicationStatus } from "@prisma/client";

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
  const notesUnlocked = await isNotesUnlocked(userId);

  const [
    profile,
    tasksTodayRows,
    tasksOverdueRows,
    remindersRows,
    notesRecentRows,
    notesPinnedRows,
    musicStat,
    notesCount,
    bookmarksCount,
    remindersUpcomingCount,
    learningActiveCount,
    applicationsActiveCount,
  ] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, select: { dashboardFocus: true } }),
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
    notesUnlocked
      ? prisma.note.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 3,
        })
      : Promise.resolve([]),
    notesUnlocked
      ? prisma.note.findMany({
          where: { userId, pinned: true },
          orderBy: { updatedAt: "desc" },
          take: 3,
        })
      : Promise.resolve([]),
    prisma.trackStats.findFirst({
      where: { userId },
      include: { track: true },
      orderBy: { lastPlayedAt: "desc" },
    }),
    notesUnlocked ? prisma.note.count({ where: { userId } }) : Promise.resolve(0),
    prisma.bookmark.count({ where: { userId } }),
    prisma.reminder.count({
      where: {
        userId,
        status: { in: [ReminderStatus.PENDING, ReminderStatus.SNOOZED] },
        remindAt: { lte: weekEnd },
      },
    }),
    prisma.course.count({
      where: { userId, status: CourseStatus.ACTIVE },
    }),
    prisma.jobApplication.count({
      where: {
        userId,
        status: {
          in: [
            ApplicationStatus.WISHLIST,
            ApplicationStatus.APPLIED,
            ApplicationStatus.SCREENING,
            ApplicationStatus.INTERVIEW,
          ],
        },
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

  const musicContinue = musicStat
    ? {
        videoId: musicStat.track.videoId,
        title: musicStat.track.title,
        channelTitle: musicStat.track.channelTitle,
        thumbnailUrl: musicStat.track.thumbnailUrl,
        lastPlayedAt: musicStat.lastPlayedAt.toISOString(),
      }
    : null;

  return {
    greeting: greetingForHour(now.getHours()),
    focus: profile?.dashboardFocus ?? null,
    counts: {
      tasksToday: tasksTodayCount,
      tasksOverdue: tasksOverdueCount,
      notes: notesCount,
      remindersUpcoming: remindersUpcomingCount,
      bookmarks: bookmarksCount,
      learningActive: learningActiveCount,
      applicationsActive: applicationsActiveCount,
    },
    tasksToday: tasksTodayRows.map(serializeTask),
    tasksOverdue: tasksOverdueRows.map(serializeTask),
    remindersNext,
    notesRecent: notesRecentRows.map(serializeNoteSummary),
    notesPinned: notesPinnedRows.map(serializeNoteSummary),
    musicContinue,
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
