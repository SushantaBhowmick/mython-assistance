import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonOk } from "@/lib/api/response";
import { cleanupGoogleCalendarEventsForUser } from "@/lib/google/sync-task-event";
import { prisma } from "@/lib/prisma/client";

export async function POST() {
  try {
    const userId = await getUserId();

    await cleanupGoogleCalendarEventsForUser(userId);

    await prisma.googleCalendarConnection.deleteMany({
      where: { userId },
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error, "[integrations/google/disconnect]");
  }
}
