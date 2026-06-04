"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { BookmarkCard } from "@/components/bookmarks/BookmarkCard";
import { CreateBookmarkDialog } from "@/components/bookmarks/CreateBookmarkDialog";
import { BookmarksListSkeleton } from "@/components/bookmarks/BookmarksSkeletons";
import { EmptyState } from "@/components/music/EmptyState";
import { Input } from "@/components/ui/input";
import { deleteBookmark, listBookmarks } from "@/lib/bookmarks/api-client";
import type { BookmarkSummary } from "@/modules/bookmarks/types";

export function BookmarksList() {
  const [bookmarks, setBookmarks] = useState<BookmarkSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listBookmarks({ q: q.trim() || undefined });
      setBookmarks(result.bookmarks);
      setDegraded(Boolean(result.degraded));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookmarks");
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, q ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, q]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this bookmark?")) return;
    setBusyId(id);
    try {
      await deleteBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[12rem] flex-1 max-w-sm">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search bookmarks…"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </div>
        <CreateBookmarkDialog onCreated={(bookmark) => setBookmarks((prev) => [bookmark, ...prev])} />
      </div>

      {degraded && !loading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          Database was temporarily unavailable.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <BookmarksListSkeleton />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          title={q ? "No matches" : "No bookmarks yet"}
          description={
            q
              ? "Try a different search term."
              : "Save articles, docs, and references with Save link or the command palette."
          }
        />
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              busy={busyId === bookmark.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
