"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/music/EmptyState";
import { NoteCard } from "@/components/notes/NoteCard";
import { NotesListSkeleton } from "@/components/notes/NotesSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listNotes, updateNote } from "@/lib/notes/api-client";
import type { NoteSummary } from "@/modules/notes/types";

export function NotesList() {
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned">("all");
  const [pinningId, setPinningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listNotes({
        q: submittedQuery || undefined,
        pinned: filter === "pinned" ? true : undefined,
      });
      setNotes(result.notes);
      setDegraded(Boolean(result.degraded));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [submittedQuery, filter]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  async function handleTogglePin(id: string, pinned: boolean) {
    setPinningId(id);
    try {
      await updateNote(id, { pinned });
      setNotes((prev) =>
        prev
          .map((n) => (n.id === id ? { ...n, pinned } : n))
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pin");
    } finally {
      setPinningId(null);
    }
  }

  const pinnedNotes = notes.filter((n) => n.pinned);
  const otherNotes = notes.filter((n) => !n.pinned);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="h-10 pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === "pinned" ? "default" : "outline"}
          onClick={() => setFilter("pinned")}
        >
          Pinned
        </Button>
      </div>

      {degraded && !loading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
          Database was temporarily unavailable. List may be incomplete.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && <NotesListSkeleton />}

      {!loading && !error && notes.length === 0 && (
        <EmptyState
          title="No notes yet"
          description="Create your first note to start building your second brain."
        />
      )}

      {!loading && notes.length > 0 && filter === "all" && pinnedNotes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Pinned</h2>
          {pinnedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onTogglePin={handleTogglePin}
              pinning={pinningId === note.id}
            />
          ))}
        </section>
      )}

      {!loading && (filter === "pinned" ? notes : otherNotes).length > 0 && (
        <section className="space-y-3">
          {filter === "all" && pinnedNotes.length > 0 && (
            <h2 className="text-sm font-medium text-muted-foreground">All notes</h2>
          )}
          {(filter === "pinned" ? notes : otherNotes).map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onTogglePin={handleTogglePin}
              pinning={pinningId === note.id}
            />
          ))}
        </section>
      )}
    </div>
  );
}
