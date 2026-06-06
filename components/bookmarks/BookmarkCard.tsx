"use client";

import { ExternalLink, Loader2, StickyNote, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { noteFromBookmark } from "@/lib/cross-module/bookmark-to-note";
import { createNote } from "@/lib/notes/api-client";
import type { BookmarkSummary } from "@/modules/bookmarks/types";

interface BookmarkCardProps {
  bookmark: BookmarkSummary;
  busy?: boolean;
  onDelete: (id: string) => void;
}

function hostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function BookmarkCard({ bookmark, busy, onDelete }: BookmarkCardProps) {
  const router = useRouter();
  const [savingNote, setSavingNote] = useState(false);

  async function handleSaveAsNote() {
    setSavingNote(true);
    try {
      const { note } = await createNote(noteFromBookmark(bookmark));
      toast.success("Saved as note");
      router.push(`/notes/${note.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-medium leading-snug">{bookmark.title}</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">{hostname(bookmark.url)}</p>
          {bookmark.description ? (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{bookmark.description}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          aria-label="Delete bookmark"
          onClick={() => onDelete(bookmark.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            Open link
          </a>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy || savingNote}
          onClick={() => void handleSaveAsNote()}
        >
          {savingNote ? <Loader2 className="size-4 animate-spin" /> : <StickyNote className="size-4" />}
          Save as note
        </Button>
      </div>
    </article>
  );
}
