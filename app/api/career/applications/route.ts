import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createApplicationSchema, listApplicationsQuerySchema } from "@/lib/career/schemas";
import {
  applicationInclude,
  buildApplicationListWhere,
  serializeApplicationDetail,
  serializeApplicationSummary,
} from "@/lib/career/serialize";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const parsed = listApplicationsQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const where = buildApplicationListWhere(userId, parsed.data);

    const { data: applications, degraded } = await safePrismaRead(
      () =>
        prisma.jobApplication.findMany({
          where,
          include: applicationInclude,
          orderBy: [{ updatedAt: "desc" }],
        }),
      [],
      "career/applications/list",
    );

    return jsonOk({
      applications: applications.map(serializeApplicationSummary),
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[career/applications/get]");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid application data", 400);
    }

    const userId = await getUserId();
    const application = await withPrismaRetry(() =>
      prisma.jobApplication.create({
        data: {
          userId,
          company: parsed.data.company,
          role: parsed.data.role,
          status: parsed.data.status,
          jobUrl: parsed.data.jobUrl ?? null,
          location: parsed.data.location ?? null,
          salaryNote: parsed.data.salaryNote ?? null,
          appliedAt: parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : null,
        },
        include: applicationInclude,
      }),
    );

    return jsonOk({ application: serializeApplicationDetail(application) }, 201);
  } catch (error) {
    return handleRouteError(error, "[career/applications/post]");
  }
}
