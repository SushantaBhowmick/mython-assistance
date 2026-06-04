import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createReminderSchema, listRemindersQuerySchema } from "@/lib/reminders/schemas";
import {
  buildReminderListWhere,
  reminderInclude,
  serializeReminder,
  serializeReminderDetail,
} from "@/lib/reminders/serialize";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

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

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const parsed = listRemindersQuerySchema.safeParse({
      filter: searchParams.get("filter") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const where = buildReminderListWhere(userId, parsed.data.filter);
    const now = new Date();

    const { data: rows, degraded } = await safePrismaRead(
      () =>
        prisma.reminder.findMany({
          where,
          include: reminderInclude,
          orderBy: { remindAt: "asc" },
        }),
      [],
      "reminders/list",
    );

    let reminders = rows.map(serializeReminder);

    if (parsed.data.filter === "upcoming") {
      reminders = reminders.filter((r) => new Date(r.effectiveAt) >= now);
    }

    return jsonOk({
      reminders,
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[reminders/get]");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createReminderSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid reminder data", 400);
    }

    const userId = await getUserId();
    const linkError = await validateLinks(userId, parsed.data.taskId, parsed.data.noteId);
    if (linkError) return jsonError(linkError, 400);

    const reminder = await withPrismaRetry(() =>
      prisma.reminder.create({
        data: {
          userId,
          title: parsed.data.title,
          remindAt: new Date(parsed.data.remindAt),
          status: parsed.data.status,
          taskId: parsed.data.taskId ?? null,
          noteId: parsed.data.noteId ?? null,
        },
        include: reminderInclude,
      }),
    );

    return jsonOk({ reminder: serializeReminderDetail(reminder) }, 201);
  } catch (error) {
    return handleRouteError(error, "[reminders/post]");
  }
}
