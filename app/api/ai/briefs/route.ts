import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonOk } from "@/lib/api/response";
import { prisma, safePrismaRead } from "@/lib/prisma/client";

export async function GET() {
  try {
    const userId = await getUserId();

    const { data: rows, degraded } = await safePrismaRead(
      () =>
        prisma.aiBrief.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      [],
      "ai/briefs",
    );

    return jsonOk({
      briefs: rows.map((row) => ({
        id: row.id,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
      })),
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[ai/briefs]");
  }
}
