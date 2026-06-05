import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateDashboardFocusSchema } from "@/lib/dashboard/schemas";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateDashboardFocusSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid focus", 400);
    }

    const userId = await getUserId();

    const profile = await withPrismaRetry(() =>
      prisma.profile.update({
        where: { userId },
        data: { dashboardFocus: parsed.data.focus },
      }),
    );

    return jsonOk({ focus: profile.dashboardFocus });
  } catch (error) {
    return handleRouteError(error, "[dashboard/focus]");
  }
}
