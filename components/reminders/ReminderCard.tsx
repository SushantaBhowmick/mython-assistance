"use client";

import { format } from "date-fns";
import { AlarmClock, Check, Clock, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReminderSummary } from "@/modules/reminders/types";
import { cn } from "@/lib/utils";

interface ReminderCardProps {
  reminder: ReminderSummary;
  onComplete: (id: string) => void;
  onSnooze: (id: string) => void;
  onDelete: (id: string) => void;
  busy?: boolean;
}

export function ReminderCard({
  reminder,
  onComplete,
  onSnooze,
  onDelete,
  busy,
}: ReminderCardProps) {
  const isDone = reminder.status === "DONE";
  const effective = new Date(reminder.effectiveAt);
  const isSnoozed = reminder.status === "SNOOZED";

  return (
    <article
      className={cn(
        "rounded-xl border bg-card/50 p-4",
        isDone && "opacity-60",
        isSnoozed && "border-amber-500/30 bg-amber-500/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className={cn("font-medium", isDone && "line-through text-muted-foreground")}>
            {reminder.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <AlarmClock className="size-3.5 shrink-0" />
            {format(effective, "MMM d, yyyy · h:mm a")}
            {isSnoozed && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Snoozed
              </Badge>
            )}
          </p>
          {(reminder.link.taskTitle || reminder.link.noteTitle) && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {reminder.link.taskTitle && (
                <Link href={`/tasks/${reminder.link.taskId}`} className="text-primary hover:underline">
                  Task: {reminder.link.taskTitle}
                </Link>
              )}
              {reminder.link.noteTitle && (
                <Link href={`/notes/${reminder.link.noteId}`} className="text-primary hover:underline">
                  Note: {reminder.link.noteTitle}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {!isDone && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => onComplete(reminder.id)}
          >
            <Check className="size-3.5" />
            Done
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onSnooze(reminder.id)}
          >
            <Clock className="size-3.5" />
            Snooze 1h
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onDelete(reminder.id)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      )}
    </article>
  );
}
