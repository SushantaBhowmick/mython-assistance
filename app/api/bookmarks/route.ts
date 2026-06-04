import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createBookmarkSchema, listBookmarksQuerySchema } from "@/lib/bookmarks/schemas";
import { buildBookmarkListWhere, serializeBookmark } from "@/lib/bookmarks/serialize";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const parsed = listBookmarksQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const where = buildBookmarkListWhere(userId, parsed.data.q);

    const { data: bookmarks, degraded } = await safePrismaRead(
      () =>
        prisma.bookmark.findMany({
          where,
          orderBy: { updatedAt: "desc" },
        }),
      [],
      "bookmarks/list",
    );

    return jsonOk({
      bookmarks: bookmarks.map(serializeBookmark),
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[bookmarks/get]");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createBookmarkSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid bookmark data", 400);
    }

    const userId = await getUserId();

    const bookmark = await withPrismaRetry(() =>
      prisma.bookmark.create({
        data: {
          userId,
          title: parsed.data.title,
          url: parsed.data.url,
          description: parsed.data.description ?? null,
          noteId: parsed.data.noteId ?? null,
        },
      }),
    );

    return jsonOk({ bookmark: serializeBookmark(bookmark) }, 201);
  } catch (error) {
    return handleRouteError(error, "[bookmarks/post]");
  }
}
