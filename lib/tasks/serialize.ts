import type { TaskDetail, TaskSummary } from "@/modules/tasks/types";
import { TaskStatus, type Prisma, type Task } from "@prisma/client";
import { startOfDay, endOfDay, addDays } from "date-fns";

export function isTaskOverdue(row: Task): boolean {
  if (!row.dueAt || row.status === "DONE" || row.status === "CANCELLED") {
    return false;
  }
  return row.dueAt < new Date();
}

export function serializeTask(row: Task): TaskSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueAt: row.dueAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    projectTag: row.projectTag,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    overdue: isTaskOverdue(row),
  };
}

export function serializeTaskDetail(row: Task): TaskDetail {
  return serializeTask(row);
}

export function buildTaskListWhere(
  userId: string,
  filter: "all" | "today" | "upcoming" | "done" | "overdue",
  q?: string,
): Prisma.TaskWhereInput {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(addDays(now, 7));

  const search = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { projectTag: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const base: Prisma.TaskWhereInput = { userId, ...search };

  switch (filter) {
    case "today":
      return {
        ...base,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueAt: { gte: todayStart, lte: todayEnd },
      };
    case "upcoming":
      return {
        ...base,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueAt: { gt: todayEnd, lte: weekEnd },
      };
    case "done":
      return { ...base, status: TaskStatus.DONE };
    case "overdue":
      return {
        ...base,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueAt: { lt: todayStart },
      };
    default:
      return {
        ...base,
        status: { not: TaskStatus.CANCELLED },
      };
  }
}
