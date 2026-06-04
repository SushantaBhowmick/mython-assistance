import type { BookmarkSummary } from "@/modules/bookmarks/types";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as T;
}

export async function listBookmarks(params?: { q?: string }) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  return parseJson<{ bookmarks: BookmarkSummary[]; degraded?: boolean }>(
    await fetch(`/api/bookmarks${qs ? `?${qs}` : ""}`),
  );
}

export async function createBookmark(input: {
  title: string;
  url: string;
  description?: string | null;
  noteId?: string | null;
}) {
  return parseJson<{ bookmark: BookmarkSummary }>(
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateBookmark(
  id: string,
  input: Partial<{
    title: string;
    url: string;
    description: string | null;
    noteId: string | null;
  }>,
) {
  return parseJson<{ bookmark: BookmarkSummary }>(
    await fetch(`/api/bookmarks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteBookmark(id: string) {
  return parseJson<{ ok: true }>(
    await fetch(`/api/bookmarks/${id}`, { method: "DELETE" }),
  );
}
