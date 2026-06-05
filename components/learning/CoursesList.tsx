"use client";

import { Clock3 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CourseCard } from "@/components/learning/CourseCard";
import { CreateCourseDialog } from "@/components/learning/CreateCourseDialog";
import { CoursesListSkeleton } from "@/components/learning/LearningSkeletons";
import { EmptyState } from "@/components/music/EmptyState";
import { Button } from "@/components/ui/button";
import {
  addCourseTopic,
  createStudySession,
  deleteCourse,
  deleteTopic,
  listCourses,
  listStudySessions,
  updateTopic,
} from "@/lib/learning/api-client";
import type { CourseDetail, StudySessionSummary, TopicSummary } from "@/modules/learning/types";

export function CoursesList() {
  const [courses, setCourses] = useState<CourseDetail[]>([]);
  const [sessions, setSessions] = useState<StudySessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesResult, sessionsResult] = await Promise.all([
        listCourses(),
        listStudySessions(),
      ]);
      const details = await Promise.all(coursesResult.courses.map((course) => fetchCourseDetail(course.id)));
      setCourses(details);
      setSessions(sessionsResult.sessions.slice(0, 8));
      setDegraded(Boolean(coursesResult.degraded || sessionsResult.degraded));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load learning data");
      setCourses([]);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function fetchCourseDetail(id: string): Promise<CourseDetail> {
    const response = await fetch(`/api/learning/courses/${id}`, { cache: "no-store" });
    const data = (await response.json()) as { course?: CourseDetail; error?: string };
    if (!response.ok || !data.course) {
      throw new Error(data.error || "Failed to load course");
    }
    return data.course;
  }

  async function handleDeleteCourse(id: string) {
    if (!window.confirm("Delete this course and its topics?")) return;
    setBusyId(id);
    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((course) => course.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddTopic(courseId: string, title: string) {
    try {
      const { topic } = await addCourseTopic(courseId, { title });
      setCourses((prev) =>
        prev.map((course) => {
          if (course.id !== courseId) return course;
          const topics = [...course.topics, topic];
          return {
            ...course,
            topics,
            totalTopics: course.totalTopics + 1,
          };
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add topic");
      throw err;
    }
  }

  async function handleToggleTopic(topic: TopicSummary) {
    try {
      const { topic: updated } = await updateTopic(topic.id, {
        completed: !topic.completed,
      });
      setCourses((prev) =>
        prev.map((course) => {
          if (course.id !== updated.courseId) return course;
          const topics = course.topics.map((item) => (item.id === updated.id ? updated : item));
          return {
            ...course,
            topics,
            completedTopics: topics.filter((item) => item.completed).length,
          };
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update topic");
    }
  }

  async function handleDeleteTopic(topicId: string) {
    if (!window.confirm("Delete this topic?")) return;
    try {
      await deleteTopic(topicId);
      setCourses((prev) =>
        prev.map((course) => {
          const topics = course.topics.filter((topic) => topic.id !== topicId);
          return {
            ...course,
            topics,
            totalTopics: topics.length,
            completedTopics: topics.filter((topic) => topic.completed).length,
          };
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete topic");
    }
  }

  async function handleQuickSession() {
    if (courses.length === 0) return;
    try {
      const { session } = await createStudySession({
        courseId: courses[0]?.id ?? null,
        minutes: 25,
      });
      setSessions((prev) => [session, ...prev].slice(0, 8));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log study session");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CreateCourseDialog
          onCreated={(course) => {
            setCourses((prev) => [course, ...prev]);
          }}
        />
        <Button type="button" variant="outline" onClick={handleQuickSession} disabled={courses.length === 0}>
          <Clock3 className="size-4" />
          Log 25 min
        </Button>
      </div>

      {degraded && !loading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          Database was temporarily unavailable.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <CoursesListSkeleton />
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create your first course and break it into topics."
        />
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              busy={busyId === course.id}
              onDelete={handleDeleteCourse}
              onAddTopic={handleAddTopic}
              onToggleTopic={handleToggleTopic}
              onDeleteTopic={handleDeleteTopic}
            />
          ))}
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <section className="space-y-2 rounded-xl border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Recent sessions</h2>
          <div className="space-y-1.5 text-sm">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  {session.courseTitle ?? "Unlinked"} · {session.minutes} min
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(session.studiedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
