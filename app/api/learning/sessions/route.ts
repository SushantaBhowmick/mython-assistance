import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createStudySessionSchema, listStudySessionsQuerySchema } from "@/lib/learning/schemas";
import { serializeStudySession } from "@/lib/learning/serialize";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const parsed = listStudySessionsQuerySchema.safeParse({
      courseId: searchParams.get("courseId") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const where = {
      userId,
      ...(parsed.data.courseId ? { courseId: parsed.data.courseId } : {}),
    };

    const { data: sessions, degraded } = await safePrismaRead(
      () =>
        prisma.studySession.findMany({
          where,
          include: { course: { select: { id: true, title: true } } },
          orderBy: { studiedAt: "desc" },
        }),
      [],
      "learning/sessions/list",
    );

    return jsonOk({
      sessions: sessions.map(serializeStudySession),
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[learning/sessions/get]");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createStudySessionSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid session data", 400);
    }

    const userId = await getUserId();

    if (parsed.data.courseId) {
      const course = await prisma.course.findFirst({
        where: { id: parsed.data.courseId, userId },
      });
      if (!course) return jsonError("Course not found", 404, "NOT_FOUND");
    }

    const session = await withPrismaRetry(() =>
      prisma.studySession.create({
        data: {
          userId,
          courseId: parsed.data.courseId ?? null,
          minutes: parsed.data.minutes,
          notes: parsed.data.notes ?? null,
          studiedAt: parsed.data.studiedAt ? new Date(parsed.data.studiedAt) : new Date(),
        },
        include: { course: { select: { id: true, title: true } } },
      }),
    );

    return jsonOk({ session: serializeStudySession(session) }, 201);
  } catch (error) {
    return handleRouteError(error, "[learning/sessions/post]");
  }
}
