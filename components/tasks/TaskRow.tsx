"use client";

import { format } from "date-fns";
import { Bell, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { defaultRemindAtForTask } from "@/lib/cross-module/remind-from-task";
import { createReminder } from "@/lib/reminders/api-client";
import type { TaskSummary } from "@/modules/tasks/types";
import { cn } from "@/lib/utils";

const priorityVariant: Record<TaskSummary["priority"], string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  HIGH: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

interface TaskRowProps {
  task: TaskSummary;
  onToggleDone: (id: string, done: boolean) => void;
  toggling?: boolean;
}

export function TaskRow({ task, onToggleDone, toggling }: TaskRowProps) {
  const isDone = task.status === "DONE";
  const [reminding, setReminding] = useState(false);

  async function handleQuickRemind() {
    setReminding(true);
    try {
      await createReminder({
        title: task.title,
        remindAt: defaultRemindAtForTask(task.dueAt),
        taskId: task.id,
      });
      toast.success("Reminder set");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create reminder");
    } finally {
      setReminding(false);
    }
  }

  return (
    <article
      className={cn(
        "flex gap-3 rounded-xl border bg-card/50 p-4 transition-colors",
        task.overdue && !isDone && "border-destructive/40 bg-destructive/5",
        isDone && "opacity-70",
      )}
    >
      <Checkbox
        checked={isDone}
        disabled={toggling || task.status === "CANCELLED"}
        onCheckedChange={(checked) => onToggleDone(task.id, checked === true)}
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
        className="mt-0.5"
      />

      <div className="min-w-0 flex-1">
        <Link
          href={`/tasks/${task.id}`}
          className={cn(
            "font-medium hover:text-primary",
            isDone && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </Link>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className={priorityVariant[task.priority]} variant="secondary">
            {task.priority.toLowerCase()}
          </Badge>
          {task.projectTag && (
            <Badge variant="outline">{task.projectTag}</Badge>
          )}
          {task.dueAt && (
            <span className="text-xs text-muted-foreground">
              Due {format(new Date(task.dueAt), "MMM d, yyyy h:mm a")}
            </span>
          )}
          {task.overdue && !isDone && (
            <Badge variant="destructive">Overdue</Badge>
          )}
        </div>
      </div>

      {!isDone && task.status !== "CANCELLED" && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={reminding}
          aria-label="Set reminder"
          onClick={() => void handleQuickRemind()}
        >
          {reminding ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
        </Button>
      )}
    </article>
  );
}
