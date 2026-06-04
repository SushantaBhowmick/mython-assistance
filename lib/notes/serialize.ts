import type { NoteDetail, NoteSummary } from "@/modules/notes/types";
import type { Note } from "@prisma/client";

function buildExcerpt(body: string, max = 140) {
  const flat = body.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  return flat.length <= max ? flat : `${flat.slice(0, max)}…`;
}

export function serializeNoteSummary(row: Note): NoteSummary {
  return {
    id: row.id,
    title: row.title,
    excerpt: buildExcerpt(row.body),
    tags: row.tags ?? [],
    pinned: row.pinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeNoteDetail(row: Note): NoteDetail {
  return {
    ...serializeNoteSummary(row),
    body: row.body,
  };
}
