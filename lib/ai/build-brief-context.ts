import "server-only";

import { addDays, endOfDay, startOfDay } from "date-fns";
import { ApplicationStatus, ReminderStatus, TaskStatus } from "@prisma/client";

import { loadDashboardSummary } from "@/lib/dashboard/serialize";
import { prisma } from "@/lib/prisma/client";

export async function buildBriefContext(userId: string) {
  const [summary, profile, interviews] = await Promise.all([
    loadDashboardSummary(userId),
    prisma.profile.findUnique({
      where: { userId },
      select: { name: true, dashboardFocus: true },
    }),
    prisma.interview.findMany({
      where: {
        scheduledAt: {
          gte: new Date(),
          lte: endOfDay(addDays(new Date(), 7)),
        },
        application: { userId },
      },
      include: { application: { select: { company: true, role: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
  ]);

  const activeCourses = await prisma.course.findMany({
    where: { userId, status: "ACTIVE" },
    include: { topics: true },
    take: 5,
  });

  const monthStart = startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const monthExpenses = await prisma.transaction.aggregate({
    where: { userId, type: "EXPENSE", occurredAt: { gte: monthStart } },
    _sum: { amount: true },
  });

  return {
    name: profile?.name ?? "there",
    focus: profile?.dashboardFocus ?? summary.focus,
    greeting: summary.greeting,
    tasksToday: summary.tasksToday.map((t) => t.title),
    tasksOverdue: summary.tasksOverdue.map((t) => t.title),
    reminders: summary.remindersNext.map((r) => ({
      title: r.title,
      at: r.effectiveAt,
    })),
    recentNotes: summary.notesRecent.map((n) => n.title),
    courses: activeCourses.map((c) => ({
      title: c.title,
      progress:
        c.topics.length === 0
          ? 0
          : Math.round(
              (c.topics.filter((t) => t.completed).length / c.topics.length) * 100,
            ),
    })),
    interviews: interviews.map((i) => ({
      company: i.application.company,
      role: i.application.role,
      at: i.scheduledAt.toISOString(),
      type: i.type,
    })),
    monthExpenseTotal: monthExpenses._sum.amount?.toString() ?? "0",
    counts: summary.counts,
  };
}

export function briefPromptFromContext(ctx: Awaited<ReturnType<typeof buildBriefContext>>) {
  return `You are a personal assistant for a single user building a Personal OS app.

Write a concise "Today" brief in markdown (max 8 bullet points). Be practical, warm, and action-oriented. No filler.

User: ${ctx.name}
Greeting context: ${ctx.greeting}
Dashboard focus: ${ctx.focus ?? "not set"}

Tasks due today: ${ctx.tasksToday.length ? ctx.tasksToday.join("; ") : "none"}
Overdue tasks: ${ctx.tasksOverdue.length ? ctx.tasksOverdue.join("; ") : "none"}
Upcoming reminders: ${
    ctx.reminders.length
      ? ctx.reminders.map((r) => `${r.title} (${r.at})`).join("; ")
      : "none"
  }
Recent notes: ${ctx.recentNotes.length ? ctx.recentNotes.join("; ") : "none"}
Active courses: ${
    ctx.courses.length
      ? ctx.courses.map((c) => `${c.title} (${c.progress}%)`).join("; ")
      : "none"
  }
Upcoming interviews (7d): ${
    ctx.interviews.length
      ? ctx.interviews
          .map((i) => `${i.role} at ${i.company} (${i.at})`)
          .join("; ")
      : "none"
  }
Month expenses so far: ${ctx.monthExpenseTotal}

Include: top 3 priorities for today, one optional learning nudge if courses exist, and one line on balance/wellbeing. Use ## Today as the title.`;
}
