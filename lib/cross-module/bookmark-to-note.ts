import type { BookmarkSummary } from "@/modules/bookmarks/types";

export function noteFromBookmark(bookmark: BookmarkSummary) {
  const lines = [`[${bookmark.title}](${bookmark.url})`, "", bookmark.url];
  if (bookmark.description?.trim()) {
    lines.push("", bookmark.description.trim());
  }

  return {
    title: bookmark.title,
    body: lines.join("\n"),
    tags: ["bookmark"],
  };
}
