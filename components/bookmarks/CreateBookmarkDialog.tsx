"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { createBookmark } from "@/lib/bookmarks/api-client";
import type { BookmarkSummary } from "@/modules/bookmarks/types";

interface CreateBookmarkDialogProps {
  onCreated: (bookmark: BookmarkSummary) => void;
  defaultUrl?: string;
}

function titleFromUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return "Saved link";
  }
}

export function CreateBookmarkDialog({ onCreated, defaultUrl = "" }: CreateBookmarkDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(defaultUrl);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setUrl(defaultUrl);
    setTitle("");
    setDescription("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      toast.error("URL is required");
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      toast.error("Enter a valid URL (include https://)");
      return;
    }

    const finalTitle = title.trim() || titleFromUrl(parsedUrl.toString());

    setLoading(true);
    try {
      const { bookmark } = await createBookmark({
        title: finalTitle,
        url: parsedUrl.toString(),
        description: description.trim() || null,
      });
      onCreated(bookmark);
      toast.success("Bookmark saved");
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save bookmark");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setUrl((current) => current || defaultUrl);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="size-4" />
          Save link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save bookmark</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="bookmark-url">URL</Label>
            <Input
              id="bookmark-url"
              type="url"
              placeholder="https://…"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (!title.trim() && event.target.value.startsWith("http")) {
                  setTitle(titleFromUrl(event.target.value));
                }
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookmark-title">Title</Label>
            <Input
              id="bookmark-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional — defaults to site name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookmark-description">Notes</Label>
            <Textarea
              id="bookmark-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Why you saved this…"
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
