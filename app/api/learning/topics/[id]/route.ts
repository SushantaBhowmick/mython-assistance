import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateTopicSchema } from "@/lib/learning/schemas";
import { serializeTopic } from "@/lib/learning/serialize";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getOwnedTopic(userId: string, id: string) {
  return prisma.topic.findFirst({
    where: { id, course: { userId } },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateTopicSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid topic data", 400);
    }

    const existing = await getOwnedTopic(userId, id);
    if (!existing) return jsonError("Topic not found", 404, "NOT_FOUND");

    const topic = await withPrismaRetry(() =>
      prisma.topic.update({
        where: { id },
        data: {
          completed: parsed.data.completed ?? !existing.completed,
        },
      }),
    );

    return jsonOk({ topic: serializeTopic(topic) });
  } catch (error) {
    return handleRouteError(error, "[learning/topics/id/patch]");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const existing = await getOwnedTopic(userId, id);
    if (!existing) return jsonError("Topic not found", 404, "NOT_FOUND");

    await withPrismaRetry(() => prisma.topic.delete({ where: { id } }));
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error, "[learning/topics/id/delete]");
  }
}
