import type { NoteDetail, NoteSummary } from "@/modules/notes/types";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : "Request failed",
    );
  }
  return data as T;
}

export async function listNotes(params?: {
  q?: string;
  tag?: string;
  pinned?: boolean;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.tag) search.set("tag", params.tag);
  if (params?.pinned != null) search.set("pinned", String(params.pinned));

  const query = search.toString();
  const url = query ? `/api/notes?${query}` : "/api/notes";

  return parseJson<{ notes: NoteSummary[]; degraded?: boolean }>(
    await fetch(url, { cache: "no-store" }),
  );
}

export async function getNote(id: string) {
  return parseJson<{ note: NoteDetail }>(
    await fetch(`/api/notes/${id}`, { cache: "no-store" }),
  );
}

export async function createNote(input: {
  title: string;
  body?: string;
  tags?: string[];
  pinned?: boolean;
}) {
  return parseJson<{ note: NoteDetail }>(
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateNote(
  id: string,
  input: Partial<{
    title: string;
    body: string;
    tags: string[];
    pinned: boolean;
  }>,
) {
  return parseJson<{ note: NoteDetail }>(
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteNote(id: string) {
  return parseJson<{ ok: boolean }>(
    await fetch(`/api/notes/${id}`, { method: "DELETE" }),
  );
}
