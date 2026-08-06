import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createNoteSchema, listNotesQuerySchema } from "@/lib/notes/schemas";
import { serializeNoteDetail, serializeNoteSummary } from "@/lib/notes/serialize";
import { requireNotesUnlocked } from "@/lib/notes/vault";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    await requireNotesUnlocked(userId);
    const { searchParams } = new URL(request.url);
    const parsed = listNotesQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      pinned: searchParams.get("pinned") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const { q, tag, pinned } = parsed.data;

    const where = {
      userId,
      ...(pinned === "true" ? { pinned: true } : pinned === "false" ? { pinned: false } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { body: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const { data: notes, degraded } = await safePrismaRead(
      () =>
        prisma.note.findMany({
          where,
          orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        }),
      [],
      "notes/list",
    );

    return jsonOk({
      notes: notes.map(serializeNoteSummary),
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[notes/get]");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid note data", 400);
    }

    const userId = await getUserId();
    await requireNotesUnlocked(userId);

    const note = await withPrismaRetry(() =>
      prisma.note.create({
        data: {
          userId,
          title: parsed.data.title,
          body: parsed.data.body,
          tags: parsed.data.tags,
          pinned: parsed.data.pinned,
        },
      }),
    );

    return jsonOk({ note: serializeNoteDetail(note) }, 201);
  } catch (error) {
    return handleRouteError(error, "[notes/post]");
  }
}
