import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateCourseSchema } from "@/lib/learning/schemas";
import { courseInclude, serializeCourseDetail } from "@/lib/learning/serialize";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getOwnedCourse(userId: string, id: string) {
  return prisma.course.findFirst({
    where: { id, userId },
    include: courseInclude,
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const course = await getOwnedCourse(userId, id);

    if (!course) return jsonError("Course not found", 404, "NOT_FOUND");

    return jsonOk({ course: serializeCourseDetail(course) });
  } catch (error) {
    return handleRouteError(error, "[learning/courses/id/get]");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateCourseSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid course data", 400);
    }

    const existing = await prisma.course.findFirst({ where: { id, userId } });
    if (!existing) return jsonError("Course not found", 404, "NOT_FOUND");

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.platform !== undefined) data.platform = parsed.data.platform;
    if (parsed.data.sourceUrl !== undefined) data.sourceUrl = parsed.data.sourceUrl;

    const course = await withPrismaRetry(() =>
      prisma.course.update({
        where: { id },
        data,
        include: courseInclude,
      }),
    );

    return jsonOk({ course: serializeCourseDetail(course) });
  } catch (error) {
    return handleRouteError(error, "[learning/courses/id/patch]");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;

    const existing = await prisma.course.findFirst({ where: { id, userId } });
    if (!existing) return jsonError("Course not found", 404, "NOT_FOUND");

    await withPrismaRetry(() => prisma.course.delete({ where: { id } }));
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error, "[learning/courses/id/delete]");
  }
}
