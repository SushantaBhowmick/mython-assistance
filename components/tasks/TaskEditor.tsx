"use client";

import { format } from "date-fns";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteTask, updateTask } from "@/lib/tasks/api-client";
import type { TaskDetail, TaskPriority, TaskStatus } from "@/modules/tasks/types";

interface TaskEditorProps {
  task: TaskDetail;
}

function toLocalDatetimeInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeInput(value: string) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function TaskEditor({ task: initial }: TaskEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(initial.status);
  const [priority, setPriority] = useState<TaskPriority>(initial.priority);
  const [dueAt, setDueAt] = useState(toLocalDatetimeInput(initial.dueAt));
  const [projectTag, setProjectTag] = useState(initial.projectTag ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateTask(initial.id, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        dueAt: fromLocalDatetimeInput(dueAt),
        projectTag: projectTag.trim() || null,
      });
      toast.success("Task saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this task?")) return;
    setDeleting(true);
    try {
      await deleteTask(initial.id);
      toast.success("Task deleted");
      router.replace("/tasks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </Button>
        <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Delete
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-desc">Description</Label>
        <Textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To do</SelectItem>
              <SelectItem value="IN_PROGRESS">In progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-due">Due date</Label>
        <Input
          id="task-due"
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-tag">Project tag</Label>
        <Input
          id="task-tag"
          value={projectTag}
          onChange={(e) => setProjectTag(e.target.value)}
          placeholder="work, personal…"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Updated {format(new Date(initial.updatedAt), "MMM d, yyyy h:mm a")}
      </p>
    </div>
  );
}
