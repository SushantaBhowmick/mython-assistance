"use client";

import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CourseDetail, TopicSummary } from "@/modules/learning/types";

interface CourseCardProps {
  course: CourseDetail;
  busy?: boolean;
  onDelete: (id: string) => void;
  onAddTopic: (courseId: string, title: string) => Promise<void>;
  onToggleTopic: (topic: TopicSummary) => Promise<void>;
  onDeleteTopic: (topicId: string) => Promise<void>;
}

export function CourseCard({
  course,
  busy,
  onDelete,
  onAddTopic,
  onToggleTopic,
  onDeleteTopic,
}: CourseCardProps) {
  const [topicTitle, setTopicTitle] = useState("");
  const [addingTopic, setAddingTopic] = useState(false);

  async function handleAddTopic(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = topicTitle.trim();
    if (!trimmed) return;

    setAddingTopic(true);
    try {
      await onAddTopic(course.id, trimmed);
      setTopicTitle("");
    } finally {
      setAddingTopic(false);
    }
  }

  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-medium leading-snug">{course.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {course.platform || "Self-paced"} · {course.completedTopics}/{course.totalTopics} topics complete
          </p>
          {course.description ? (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          aria-label="Delete course"
          onClick={() => onDelete(course.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {course.topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">No topics yet.</p>
        ) : (
          course.topics.map((topic) => (
            <div key={topic.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
              <button
                type="button"
                className="inline-flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                onClick={() => onToggleTopic(topic)}
              >
                {topic.completed ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
                <span className={topic.completed ? "line-through text-muted-foreground" : ""}>
                  {topic.title}
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onDeleteTopic(topic.id)}
                aria-label="Delete topic"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddTopic} className="mt-3 flex gap-2">
        <Input
          value={topicTitle}
          onChange={(event) => setTopicTitle(event.target.value)}
          placeholder="Add topic..."
          className="h-9"
        />
        <Button type="submit" size="sm" variant="outline" disabled={addingTopic}>
          <Plus className="size-3.5" />
          Add
        </Button>
      </form>
    </article>
  );
}
