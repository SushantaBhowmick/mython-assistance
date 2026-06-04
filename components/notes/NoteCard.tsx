"use client";

import { Pin, PinOff } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NoteSummary } from "@/modules/notes/types";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: NoteSummary;
  onTogglePin?: (id: string, pinned: boolean) => void;
  pinning?: boolean;
}

export function NoteCard({ note, onTogglePin, pinning }: NoteCardProps) {
  const updated = new Date(note.updatedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article
      className={cn(
        "group rounded-xl border bg-card/50 p-4 transition-colors hover:bg-card/80",
        note.pinned && "border-primary/30 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/notes/${note.id}`} className="min-w-0 flex-1">
          <h3 className="font-medium tracking-tight group-hover:text-primary">
            {note.title}
          </h3>
          {note.excerpt && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{note.excerpt}</p>
          )}
        </Link>
        {onTogglePin && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            disabled={pinning}
            onClick={() => onTogglePin(note.id, !note.pinned)}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
          >
            {note.pinned ? (
              <PinOff className="size-4 text-primary" />
            ) : (
              <Pin className="size-4" />
            )}
          </Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Updated {updated}</span>
        {note.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </article>
  );
}
