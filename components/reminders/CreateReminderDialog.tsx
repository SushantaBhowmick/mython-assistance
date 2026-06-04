"use client";

import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createReminder } from "@/lib/reminders/api-client";
import { listNotes } from "@/lib/notes/api-client";
import { listTasks } from "@/lib/tasks/api-client";
import type { ReminderSummary } from "@/modules/reminders/types";

interface CreateReminderDialogProps {
  onCreated: (reminder: ReminderSummary) => void;
}

function defaultRemindAtLocal() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateReminderDialog({ onCreated }: CreateReminderDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState(defaultRemindAtLocal());
  const [taskId, setTaskId] = useState<string>("none");
  const [noteId, setNoteId] = useState<string>("none");
  const [tasks, setTasks] = useState<Array<{ id: string; title: string }>>([]);
  const [notes, setNotes] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    Promise.all([
      listTasks({ filter: "all" }).then((r) => r.tasks.slice(0, 30)),
      listNotes().then((r) => r.notes.slice(0, 30)),
    ])
      .then(([taskList, noteList]) => {
        setTasks(taskList.map((t) => ({ id: t.id, title: t.title })));
        setNotes(noteList.map((n) => ({ id: n.id, title: n.title })));
      })
      .catch(() => undefined);
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      const { reminder } = await createReminder({
        title: trimmed,
        remindAt: new Date(remindAt).toISOString(),
        taskId: taskId === "none" ? null : taskId,
        noteId: noteId === "none" ? null : noteId,
      });
      onCreated(reminder);
      setTitle("");
      setRemindAt(defaultRemindAtLocal());
      setTaskId("none");
      setNoteId("none");
      setOpen(false);
      toast.success("Reminder created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create reminder");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New reminder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create reminder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-title">Title</Label>
            <Input
              id="reminder-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What to remember?"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder-at">Remind at</Label>
            <Input
              id="reminder-at"
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Link to task (optional)</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Link to note (optional)</Label>
            <Select value={noteId} onValueChange={setNoteId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {notes.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Create reminder
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
