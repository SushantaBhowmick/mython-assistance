import type { TaskDetail, TaskSummary } from "@/modules/tasks/types";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : "Request failed",
    );
  }
  return data as T;
}

export async function listTasks(params?: {
  filter?: "all" | "today" | "upcoming" | "done" | "overdue";
  q?: string;
}) {
  const search = new URLSearchParams();
  if (params?.filter) search.set("filter", params.filter);
  if (params?.q) search.set("q", params.q);
  const query = search.toString();
  const url = query ? `/api/tasks?${query}` : "/api/tasks";

  return parseJson<{ tasks: TaskSummary[]; degraded?: boolean }>(
    await fetch(url, { cache: "no-store" }),
  );
}

export async function getTask(id: string) {
  return parseJson<{ task: TaskDetail }>(
    await fetch(`/api/tasks/${id}`, { cache: "no-store" }),
  );
}

export async function createTask(input: {
  title: string;
  description?: string | null;
  status?: TaskSummary["status"];
  priority?: TaskSummary["priority"];
  dueAt?: string | null;
  projectTag?: string | null;
}) {
  return parseJson<{ task: TaskDetail }>(
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateTask(
  id: string,
  input: Partial<{
    title: string;
    description: string | null;
    status: TaskSummary["status"];
    priority: TaskSummary["priority"];
    dueAt: string | null;
    projectTag: string | null;
  }>,
) {
  return parseJson<{ task: TaskDetail }>(
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteTask(id: string) {
  return parseJson<{ ok: boolean }>(
    await fetch(`/api/tasks/${id}`, { method: "DELETE" }),
  );
}
