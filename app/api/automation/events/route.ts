import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonOk } from "@/lib/api/response";
import { prisma, safePrismaRead } from "@/lib/prisma/client";

export async function GET() {
  try {
    const userId = await getUserId();

    const { data: events, degraded } = await safePrismaRead(
      () =>
        prisma.automationEvent.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      [],
      "automation/events",
    );

    return jsonOk({
      events: events.map((row) => ({
        id: row.id,
        event: row.event,
        payload: row.payload,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      })),
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[automation/events]");
  }
}
