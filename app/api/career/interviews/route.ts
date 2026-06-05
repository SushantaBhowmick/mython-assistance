import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createInterviewSchema } from "@/lib/career/schemas";
import { serializeInterview } from "@/lib/career/serialize";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

export async function GET() {
  try {
    const userId = await getUserId();
    const { data: interviews, degraded } = await safePrismaRead(
      () =>
        prisma.interview.findMany({
          where: { application: { userId } },
          include: {
            application: { select: { id: true, company: true, role: true } },
          },
          orderBy: { scheduledAt: "asc" },
        }),
      [],
      "career/interviews/list",
    );

    return jsonOk({
      interviews: interviews.map(serializeInterview),
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[career/interviews/get]");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createInterviewSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid interview data", 400);
    }

    const userId = await getUserId();
    const application = await prisma.jobApplication.findFirst({
      where: { id: parsed.data.applicationId, userId },
    });
    if (!application) return jsonError("Application not found", 404, "NOT_FOUND");

    const interview = await withPrismaRetry(() =>
      prisma.interview.create({
        data: {
          applicationId: parsed.data.applicationId,
          scheduledAt: new Date(parsed.data.scheduledAt),
          type: parsed.data.type ?? null,
          notes: parsed.data.notes ?? null,
        },
        include: {
          application: { select: { id: true, company: true, role: true } },
        },
      }),
    );

    return jsonOk({ interview: serializeInterview(interview) }, 201);
  } catch (error) {
    return handleRouteError(error, "[career/interviews/post]");
  }
}
