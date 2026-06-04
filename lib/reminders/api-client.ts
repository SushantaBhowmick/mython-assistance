import type { ReminderDetail, ReminderSummary } from "@/modules/reminders/types";

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

export async function listReminders(params?: {
  filter?: "upcoming" | "pending" | "done" | "all";
}) {
  const search = new URLSearchParams();
  if (params?.filter) search.set("filter", params.filter);
  const query = search.toString();
  const url = query ? `/api/reminders?${query}` : "/api/reminders";

  return parseJson<{ reminders: ReminderSummary[]; degraded?: boolean }>(
    await fetch(url, { cache: "no-store" }),
  );
}

export async function getReminder(id: string) {
  return parseJson<{ reminder: ReminderDetail }>(
    await fetch(`/api/reminders/${id}`, { cache: "no-store" }),
  );
}

export async function createReminder(input: {
  title: string;
  remindAt: string;
  taskId?: string | null;
  noteId?: string | null;
}) {
  return parseJson<{ reminder: ReminderDetail }>(
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateReminder(
  id: string,
  input: Partial<{
    title: string;
    remindAt: string;
    status: ReminderSummary["status"];
    snoozedUntil: string | null;
    taskId: string | null;
    noteId: string | null;
  }>,
) {
  return parseJson<{ reminder: ReminderDetail }>(
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function snoozeReminder(id: string, hours = 1) {
  return parseJson<{ reminder: ReminderDetail }>(
    await fetch(`/api/reminders/${id}/snooze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours }),
    }),
  );
}

export async function deleteReminder(id: string) {
  return parseJson<{ ok: boolean }>(
    await fetch(`/api/reminders/${id}`, { method: "DELETE" }),
  );
}
