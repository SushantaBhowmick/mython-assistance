import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateApplicationSchema } from "@/lib/career/schemas";
import { applicationInclude, serializeApplicationDetail } from "@/lib/career/serialize";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getOwnedApplication(userId: string, id: string) {
  return prisma.jobApplication.findFirst({
    where: { id, userId },
    include: applicationInclude,
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const application = await getOwnedApplication(userId, id);

    if (!application) return jsonError("Application not found", 404, "NOT_FOUND");
    return jsonOk({ application: serializeApplicationDetail(application) });
  } catch (error) {
    return handleRouteError(error, "[career/applications/id/get]");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid application data", 400);
    }

    const existing = await prisma.jobApplication.findFirst({ where: { id, userId } });
    if (!existing) return jsonError("Application not found", 404, "NOT_FOUND");

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.appliedAt !== undefined) {
      data.appliedAt = parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : null;
    }

    const application = await withPrismaRetry(() =>
      prisma.jobApplication.update({
        where: { id },
        data,
        include: applicationInclude,
      }),
    );

    return jsonOk({ application: serializeApplicationDetail(application) });
  } catch (error) {
    return handleRouteError(error, "[career/applications/id/patch]");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const existing = await prisma.jobApplication.findFirst({ where: { id, userId } });
    if (!existing) return jsonError("Application not found", 404, "NOT_FOUND");

    await withPrismaRetry(() => prisma.jobApplication.delete({ where: { id } }));
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error, "[career/applications/id/delete]");
  }
}
