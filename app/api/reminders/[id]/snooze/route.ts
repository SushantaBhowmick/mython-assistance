import { addHours } from "date-fns";

import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { reminderInclude, serializeReminderDetail } from "@/lib/reminders/serialize";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";
import { z } from "zod";

const snoozeSchema = z.object({
  hours: z.number().min(1).max(168).optional().default(1),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = snoozeSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid snooze data", 400);
    }

    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) return jsonError("Reminder not found", 404, "NOT_FOUND");

    const snoozedUntil = addHours(new Date(), parsed.data.hours);

    const reminder = await withPrismaRetry(() =>
      prisma.reminder.update({
        where: { id },
        data: {
          status: "SNOOZED",
          snoozedUntil,
        },
        include: reminderInclude,
      }),
    );

    return jsonOk({ reminder: serializeReminderDetail(reminder) });
  } catch (error) {
    return handleRouteError(error, "[reminders/id/snooze]");
  }
}
