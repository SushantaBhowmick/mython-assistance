import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateTaskSchema } from "@/lib/tasks/schemas";
import { serializeTaskDetail } from "@/lib/tasks/serialize";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;

    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) return jsonError("Task not found", 404, "NOT_FOUND");

    return jsonOk({ task: serializeTaskDetail(task) });
  } catch (error) {
    return handleRouteError(error, "[tasks/id/get]");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid task data", 400);
    }

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) return jsonError("Task not found", 404, "NOT_FOUND");

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.dueAt !== undefined) {
      data.dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;
    }
    if (parsed.data.status) {
      if (parsed.data.status === "DONE") {
        data.completedAt = new Date();
      } else if (parsed.data.status === "TODO" || parsed.data.status === "IN_PROGRESS") {
        data.completedAt = null;
      }
    }

    const task = await withPrismaRetry(() =>
      prisma.task.update({ where: { id }, data }),
    );

    return jsonOk({ task: serializeTaskDetail(task) });
  } catch (error) {
    return handleRouteError(error, "[tasks/id/patch]");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) return jsonError("Task not found", 404, "NOT_FOUND");

    await withPrismaRetry(() => prisma.task.delete({ where: { id } }));

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error, "[tasks/id/delete]");
  }
}
