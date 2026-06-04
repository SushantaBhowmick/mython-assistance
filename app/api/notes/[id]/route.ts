import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateNoteSchema } from "@/lib/notes/schemas";
import { serializeNoteDetail } from "@/lib/notes/serialize";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      return jsonError("Note not found", 404, "NOT_FOUND");
    }

    return jsonOk({ note: serializeNoteDetail(note) });
  } catch (error) {
    return handleRouteError(error, "[notes/id/get]");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateNoteSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid note data", 400);
    }

    const existing = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return jsonError("Note not found", 404, "NOT_FOUND");
    }

    const note = await withPrismaRetry(() =>
      prisma.note.update({
        where: { id },
        data: parsed.data,
      }),
    );

    return jsonOk({ note: serializeNoteDetail(note) });
  } catch (error) {
    return handleRouteError(error, "[notes/id/patch]");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;

    const existing = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return jsonError("Note not found", 404, "NOT_FOUND");
    }

    await withPrismaRetry(() => prisma.note.delete({ where: { id } }));

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error, "[notes/id/delete]");
  }
}
