"use client";

import { Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { NoteMarkdownPreview } from "@/components/notes/NoteMarkdownPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { deleteNote, updateNote } from "@/lib/notes/api-client";
import type { NoteDetail } from "@/modules/notes/types";

interface NoteEditorProps {
  note: NoteDetail;
}

export function NoteEditor({ note: initial }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [tagsInput, setTagsInput] = useState(initial.tags.join(", "));
  const [pinned, setPinned] = useState(initial.pinned);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutosaveRef = useRef(true);

  const parseTags = useCallback(
    () =>
      tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20),
    [tagsInput],
  );

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await updateNote(initial.id, {
        title: title.trim(),
        body,
        tags: parseTags(),
        pinned,
      });
      toast.success("Note saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [initial.id, title, body, pinned, parseTags]);

  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void save();
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, body, tagsInput, pinned, save]);

  async function handleDelete() {
    if (!window.confirm("Delete this note permanently?")) return;

    setDeleting(true);
    try {
      await deleteNote(initial.id);
      toast.success("Note deleted");
      router.replace("/notes");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save now
        </Button>
        <Button
          type="button"
          variant={pinned ? "default" : "outline"}
          size="sm"
          onClick={() => setPinned((p) => !p)}
        >
          {pinned ? "Pinned" : "Pin note"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Delete
        </Button>
        <span className="text-xs text-muted-foreground">Auto-saves after you stop typing</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note-title">Title</Label>
        <Input
          id="note-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-medium"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note-tags">Tags (comma separated)</Label>
        <Input
          id="note-tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="work, ideas, learning"
        />
        <div className="flex flex-wrap gap-1">
          {parseTags().map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write in Markdown…"
            className="min-h-[320px] font-mono text-sm leading-relaxed"
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-3 rounded-xl border bg-muted/20 p-4">
          <NoteMarkdownPreview content={body} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
