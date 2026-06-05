import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createTopicSchema } from "@/lib/learning/schemas";
import { serializeTopic } from "@/lib/learning/serialize";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id: courseId } = await context.params;
    const body = await request.json();
    const parsed = createTopicSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid topic data", 400);
    }

    const course = await prisma.course.findFirst({ where: { id: courseId, userId } });
    if (!course) return jsonError("Course not found", 404, "NOT_FOUND");

    const lastPosition = await prisma.topic.findFirst({
      where: { courseId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const topic = await withPrismaRetry(() =>
      prisma.topic.create({
        data: {
          courseId,
          title: parsed.data.title,
          position: (lastPosition?.position ?? -1) + 1,
        },
      }),
    );

    return jsonOk({ topic: serializeTopic(topic) }, 201);
  } catch (error) {
    return handleRouteError(error, "[learning/courses/id/topics/post]");
  }
}
