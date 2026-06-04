"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/music/EmptyState";
import { CreateReminderDialog } from "@/components/reminders/CreateReminderDialog";
import { ReminderCard } from "@/components/reminders/ReminderCard";
import { RemindersListSkeleton } from "@/components/reminders/RemindersSkeletons";
import { Button } from "@/components/ui/button";
import {
  deleteReminder,
  listReminders,
  snoozeReminder,
  updateReminder,
} from "@/lib/reminders/api-client";
import type { ReminderSummary } from "@/modules/reminders/types";

type ReminderFilter = "upcoming" | "pending" | "done" | "all";

const filters: { id: ReminderFilter; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "pending", label: "Pending" },
  { id: "done", label: "Done" },
  { id: "all", label: "All" },
];

export function RemindersList() {
  const [reminders, setReminders] = useState<ReminderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [filter, setFilter] = useState<ReminderFilter>("upcoming");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listReminders({ filter });
      setReminders(result.reminders);
      setDegraded(Boolean(result.degraded));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reminders");
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleComplete(id: string) {
    setBusyId(id);
    try {
      await updateReminder(id, { status: "DONE", snoozedUntil: null });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSnooze(id: string) {
    setBusyId(id);
    try {
      await snoozeReminder(id, 1);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to snooze");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this reminder?")) return;
    setBusyId(id);
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateReminderDialog
          onCreated={(reminder) => {
            setReminders((prev) => [reminder, ...prev]);
          }}
        />
      </div>

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
          Database was temporarily unavailable.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && <RemindersListSkeleton />}

      {!loading && !error && reminders.length === 0 && (
        <EmptyState
          title="No reminders"
          description="Create a reminder to get notified about tasks and notes."
        />
      )}

      {!loading && reminders.length > 0 && (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
              onDelete={handleDelete}
              busy={busyId === reminder.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
