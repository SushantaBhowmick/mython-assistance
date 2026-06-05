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
import { createCourse } from "@/lib/learning/api-client";
import type { CourseDetail } from "@/modules/learning/types";

interface CreateCourseDialogProps {
  onCreated: (course: CourseDetail) => void;
}

export function CreateCourseDialog({ onCreated }: CreateCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setTitle("");
    setPlatform("");
    setSourceUrl("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      const { course } = await createCourse({
        title: trimmedTitle,
        platform: platform.trim() || null,
        sourceUrl: sourceUrl.trim() || null,
      });
      onCreated(course);
      setOpen(false);
      resetForm();
      toast.success("Course created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="size-4" />
          New course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create course</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="course-title">Title</Label>
            <Input
              id="course-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="System design foundations"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-platform">Platform (optional)</Label>
            <Input
              id="course-platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              placeholder="Udemy, Coursera, YouTube..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-source">Source URL (optional)</Label>
            <Input
              id="course-source"
              type="url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
