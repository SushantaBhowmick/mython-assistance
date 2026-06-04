"use client";

import { ExternalLink, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
      <div className="mt-3">
        <Button asChild variant="outline" size="sm">
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            Open link
          </a>
        </Button>
      </div>
    </article>
  );
}
