import type { Bookmark } from "@prisma/client";

import type { BookmarkSummary } from "@/modules/bookmarks/types";

export function serializeBookmark(bookmark: Bookmark): BookmarkSummary {
  return {
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description,
    noteId: bookmark.noteId,
    createdAt: bookmark.createdAt.toISOString(),
    updatedAt: bookmark.updatedAt.toISOString(),
  };
}

export function buildBookmarkListWhere(userId: string, q?: string) {
  const where: { userId: string; OR?: Array<{ title: { contains: string; mode: "insensitive" } } | { url: { contains: string; mode: "insensitive" } } | { description: { contains: string; mode: "insensitive" } }> } = {
    userId,
  };

  const term = q?.trim();
  if (term) {
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { url: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }

  return where;
}
