"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoteEditorSkeleton } from "@/components/notes/NotesSkeletons";
import { getNote } from "@/lib/notes/api-client";
import type { NoteDetail } from "@/modules/notes/types";

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    setLoading(true);
    getNote(params.id)
      .then(({ note: data }) => setNote(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load note"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <NoteEditorSkeleton />;

  if (error || !note) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error ?? "Note not found"}
      </div>
    );
  }

  return <NoteEditor note={note} />;
}
