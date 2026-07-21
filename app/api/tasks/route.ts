import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { syncTaskToGoogleCalendar } from "@/lib/google/sync-task-event";
import { createTaskSchema, listTasksQuerySchema } from "@/lib/tasks/schemas";
import { buildTaskListWhere, serializeTask, serializeTaskDetail } from "@/lib/tasks/serialize";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

function taskDataFromInput(data: {
  title: string;
  description?: string | null;
  status?: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueAt?: string | null;
  projectTag?: string | null;
}) {
  const dueAt = data.dueAt ? new Date(data.dueAt) : null;
  const status = data.status ?? "TODO";

  return {
    title: data.title,
    description: data.description ?? null,
    status,
    priority: data.priority ?? "MEDIUM",
    dueAt,
    projectTag: data.projectTag ?? null,
    completedAt: status === "DONE" ? new Date() : null,
  };
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const parsed = listTasksQuerySchema.safeParse({
      filter: searchParams.get("filter") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const where = buildTaskListWhere(userId, parsed.data.filter, parsed.data.q);

    const { data: tasks, degraded } = await safePrismaRead(
      () =>
        prisma.task.findMany({
          where,
          orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
        }),
      [],
      "tasks/list",
    );

    return jsonOk({
      tasks: tasks.map(serializeTask),
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[tasks/get]");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid task data", 400);
    }

    const userId = await getUserId();

    const task = await withPrismaRetry(() =>
      prisma.task.create({
        data: {
          userId,
          ...taskDataFromInput(parsed.data),
        },
      }),
    );

    await syncTaskToGoogleCalendar(task);

    const synced = await prisma.task.findFirst({ where: { id: task.id, userId } });

    return jsonOk({ task: serializeTaskDetail(synced ?? task) }, 201);
  } catch (error) {
    return handleRouteError(error, "[tasks/post]");
  }
}
