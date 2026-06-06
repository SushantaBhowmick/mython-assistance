/** Default remind time when creating a reminder from a task. */
export function defaultRemindAtForTask(dueAt: string | null): string {
  const now = Date.now();
  if (dueAt) {
    const due = new Date(dueAt).getTime();
    if (due > now) return new Date(due).toISOString();
  }
  return new Date(now + 60 * 60 * 1000).toISOString();
}

export function toLocalDatetimeInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
