import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateBookmarkSchema } from "@/lib/bookmarks/schemas";
import { serializeBookmark } from "@/lib/bookmarks/serialize";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getOwnedBookmark(userId: string, id: string) {
  return prisma.bookmark.findFirst({ where: { id, userId } });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateBookmarkSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid bookmark data", 400);
    }

    const userId = await getUserId();
    const existing = await getOwnedBookmark(userId, id);

    if (!existing) {
      return jsonError("Bookmark not found", 404);
    }

    const bookmark = await withPrismaRetry(() =>
      prisma.bookmark.update({
        where: { id },
        data: parsed.data,
      }),
    );

    return jsonOk({ bookmark: serializeBookmark(bookmark) });
  } catch (error) {
    return handleRouteError(error, "[bookmarks/patch]");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getUserId();
    const existing = await getOwnedBookmark(userId, id);

    if (!existing) {
      return jsonError("Bookmark not found", 404);
    }

    await withPrismaRetry(() => prisma.bookmark.delete({ where: { id } }));

    return jsonOk({ ok: true as const });
  } catch (error) {
    return handleRouteError(error, "[bookmarks/delete]");
  }
}
