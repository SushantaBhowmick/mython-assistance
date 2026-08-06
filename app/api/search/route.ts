import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma, safePrismaRead } from "@/lib/prisma/client";
import { serializeBookmark } from "@/lib/bookmarks/serialize";
import { serializeNoteSummary } from "@/lib/notes/serialize";
import { isNotesUnlocked } from "@/lib/notes/vault";
import { serializeReminder } from "@/lib/reminders/serialize";
import { reminderInclude } from "@/lib/reminders/serialize";
import { serializeTask } from "@/lib/tasks/serialize";
import { globalSearchQuerySchema } from "@/lib/search/schemas";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const notesUnlocked = await isNotesUnlocked(userId);
    const { searchParams } = new URL(request.url);
    const parsed = globalSearchQuerySchema.safeParse({
      q: searchParams.get("q") ?? "",
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const { q, limit } = parsed.data;
    const term = q;

    const { data, degraded } = await safePrismaRead(
      async () => {
        const [tasks, notes, reminders, bookmarks] = await Promise.all([
          prisma.task.findMany({
            where: {
              userId,
              OR: [
                { title: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } },
              ],
            },
            take: limit,
            orderBy: { updatedAt: "desc" },
          }),
          notesUnlocked
            ? prisma.note.findMany({
                where: {
                  userId,
                  OR: [
                    { title: { contains: term, mode: "insensitive" } },
                    { body: { contains: term, mode: "insensitive" } },
                  ],
                },
                take: limit,
                orderBy: { updatedAt: "desc" },
              })
            : Promise.resolve([]),
          prisma.reminder.findMany({
            where: {
              userId,
              title: { contains: term, mode: "insensitive" },
            },
            include: reminderInclude,
            take: limit,
            orderBy: { remindAt: "asc" },
          }),
          prisma.bookmark.findMany({
            where: {
              userId,
              OR: [
                { title: { contains: term, mode: "insensitive" } },
                { url: { contains: term, mode: "insensitive" } },
              ],
            },
            take: limit,
            orderBy: { updatedAt: "desc" },
          }),
        ]);

        return {
          results: [
            ...tasks.map((row) => ({
              type: "task" as const,
              id: row.id,
              title: row.title,
              href: `/tasks/${row.id}`,
              meta: row.status,
            })),
            ...notes.map((row) => ({
              type: "note" as const,
              id: row.id,
              title: row.title,
              href: `/notes/${row.id}`,
              meta: "note",
            })),
            ...reminders.map((row) => {
              const r = serializeReminder(row);
              return {
                type: "reminder" as const,
                id: r.id,
                title: r.title,
                href: "/reminders",
                meta: r.status,
              };
            }),
            ...bookmarks.map((row) => {
              const b = serializeBookmark(row);
              return {
                type: "bookmark" as const,
                id: b.id,
                title: b.title,
                href: "/bookmarks",
                meta: b.url,
              };
            }),
          ].slice(0, limit * 2),
        };
      },
      { results: [] },
      "search/global",
    );

    return jsonOk({ ...data, degraded: degraded || undefined });
  } catch (error) {
    return handleRouteError(error, "[search/get]");
  }
}
