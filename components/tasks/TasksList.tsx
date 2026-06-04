"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/music/EmptyState";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TasksListSkeleton } from "@/components/tasks/TasksSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTask, listTasks, updateTask } from "@/lib/tasks/api-client";
import type { TaskSummary } from "@/modules/tasks/types";

type TaskFilter = "all" | "today" | "upcoming" | "done" | "overdue";

const filters: { id: TaskFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "overdue", label: "Overdue" },
  { id: "done", label: "Done" },
];

export function TasksList() {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listTasks({
        filter,
        q: submittedQuery || undefined,
      });
      setTasks(result.tasks);
      setDegraded(Boolean(result.degraded));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [filter, submittedQuery]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleQuickAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    setCreating(true);
    try {
      const { task } = await createTask({ title });
      setQuickTitle("");
      setTasks((prev) => [task, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleDone(id: string, done: boolean) {
    setTogglingId(id);
    try {
      const { task } = await updateTask(id, {
        status: done ? "DONE" : "TODO",
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? task : t)).filter((t) => {
          if (filter === "done") return t.status === "DONE";
          if (filter === "overdue") return t.overdue && t.status !== "DONE";
          if (filter === "today" || filter === "upcoming") return t.status !== "DONE";
          return t.status !== "CANCELLED";
        }),
      );
      if (filter !== "all" && filter !== "done") {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Quick add a task…"
          className="h-10"
        />
        <Button type="submit" disabled={creating}>
          Add
        </Button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmittedQuery(query.trim());
        }}
        className="flex gap-2"
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks…"
          className="h-10"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.id}
            type="button"
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {degraded && !loading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          Database was temporarily unavailable. List may be incomplete.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && <TasksListSkeleton />}

      {!loading && !error && tasks.length === 0 && (
        <EmptyState
          title="No tasks here"
          description="Add a task above or create one with full details."
        />
      )}

      {!loading && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggleDone={handleToggleDone}
              toggling={togglingId === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
