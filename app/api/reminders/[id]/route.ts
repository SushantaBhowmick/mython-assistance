import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateReminderSchema } from "@/lib/reminders/schemas";
import { reminderInclude, serializeReminderDetail } from "@/lib/reminders/serialize";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function validateLinks(userId: string, taskId?: string | null, noteId?: string | null) {
  if (taskId) {
    const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!task) return "Linked task not found";
  }
  if (noteId) {
    const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
    if (!note) return "Linked note not found";
  }
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;

    const reminder = await prisma.reminder.findFirst({
      where: { id, userId },
      include: reminderInclude,
    });

    if (!reminder) return jsonError("Reminder not found", 404, "NOT_FOUND");

    return jsonOk({ reminder: serializeReminderDetail(reminder) });
  } catch (error) {
    return handleRouteError(error, "[reminders/id/get]");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateReminderSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid reminder data", 400);
    }

    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) return jsonError("Reminder not found", 404, "NOT_FOUND");

    const linkError = await validateLinks(
      userId,
      parsed.data.taskId ?? existing.taskId,
      parsed.data.noteId ?? existing.noteId,
    );
    if (linkError) return jsonError(linkError, 400);

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.remindAt) data.remindAt = new Date(parsed.data.remindAt);
    if (parsed.data.snoozedUntil !== undefined) {
      data.snoozedUntil = parsed.data.snoozedUntil ? new Date(parsed.data.snoozedUntil) : null;
    }
    if (parsed.data.status === "PENDING") {
      data.snoozedUntil = null;
    }

    const reminder = await withPrismaRetry(() =>
      prisma.reminder.update({
        where: { id },
        data,
        include: reminderInclude,
      }),
    );

    return jsonOk({ reminder: serializeReminderDetail(reminder) });
  } catch (error) {
    return handleRouteError(error, "[reminders/id/patch]");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;

    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) return jsonError("Reminder not found", 404, "NOT_FOUND");

    await withPrismaRetry(() => prisma.reminder.delete({ where: { id } }));

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error, "[reminders/id/delete]");
  }
}
