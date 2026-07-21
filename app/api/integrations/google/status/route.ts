import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonOk } from "@/lib/api/response";
import { isGoogleCalendarConfigured } from "@/lib/google/env";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  try {
    const userId = await getUserId();
    const configured = isGoogleCalendarConfigured();
    const connection = configured
      ? await prisma.googleCalendarConnection.findUnique({
          where: { userId },
          select: { googleEmail: true, updatedAt: true },
        })
      : null;

    return jsonOk({
      configured,
      connected: Boolean(connection),
      googleEmail: connection?.googleEmail ?? null,
      connectedAt: connection?.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    return handleRouteError(error, "[integrations/google/status]");
  }
}
