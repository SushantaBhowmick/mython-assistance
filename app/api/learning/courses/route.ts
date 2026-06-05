import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createCourseSchema, listCoursesQuerySchema } from "@/lib/learning/schemas";
import { buildCourseListWhere, courseInclude, serializeCourseDetail, serializeCourseSummary } from "@/lib/learning/serialize";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const parsed = listCoursesQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const where = buildCourseListWhere(userId, parsed.data);

    const { data: courses, degraded } = await safePrismaRead(
      () =>
        prisma.course.findMany({
          where,
          include: courseInclude,
          orderBy: { updatedAt: "desc" },
        }),
      [],
      "learning/courses/list",
    );

    return jsonOk({
      courses: courses.map(serializeCourseSummary),
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[learning/courses/get]");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createCourseSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid course data", 400);
    }

    const userId = await getUserId();
    const course = await withPrismaRetry(() =>
      prisma.course.create({
        data: {
          userId,
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          platform: parsed.data.platform ?? null,
          sourceUrl: parsed.data.sourceUrl ?? null,
          status: parsed.data.status,
        },
        include: courseInclude,
      }),
    );

    return jsonOk({ course: serializeCourseDetail(course) }, 201);
  } catch (error) {
    return handleRouteError(error, "[learning/courses/post]");
  }
}
