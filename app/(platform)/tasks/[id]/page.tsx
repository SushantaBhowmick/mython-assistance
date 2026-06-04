"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { TaskEditor } from "@/components/tasks/TaskEditor";
import { TaskEditorSkeleton } from "@/components/tasks/TasksSkeletons";
import { getTask } from "@/lib/tasks/api-client";
import type { TaskDetail } from "@/modules/tasks/types";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    getTask(params.id)
      .then(({ task: data }) => setTask(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load task"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <TaskEditorSkeleton />;

  if (error || !task) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error ?? "Task not found"}
      </div>
    );
  }

  return <TaskEditor task={task} />;
}
