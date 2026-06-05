import type { CourseDetail, CourseSummary, StudySessionSummary, TopicSummary } from "@/modules/learning/types";

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

export async function listCourses(params?: {
  q?: string;
  status?: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.status) search.set("status", params.status);
  const query = search.toString();
  const url = query ? `/api/learning/courses?${query}` : "/api/learning/courses";

  return parseJson<{ courses: CourseSummary[]; degraded?: boolean }>(
    await fetch(url, { cache: "no-store" }),
  );
}

export async function getCourse(id: string) {
  return parseJson<{ course: CourseDetail }>(
    await fetch(`/api/learning/courses/${id}`, { cache: "no-store" }),
  );
}

export async function createCourse(input: {
  title: string;
  description?: string | null;
  platform?: string | null;
  sourceUrl?: string | null;
  status?: CourseSummary["status"];
}) {
  return parseJson<{ course: CourseDetail }>(
    await fetch("/api/learning/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateCourse(
  id: string,
  input: Partial<{
    title: string;
    description: string | null;
    platform: string | null;
    sourceUrl: string | null;
    status: CourseSummary["status"];
  }>,
) {
  return parseJson<{ course: CourseDetail }>(
    await fetch(`/api/learning/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteCourse(id: string) {
  return parseJson<{ ok: boolean }>(
    await fetch(`/api/learning/courses/${id}`, { method: "DELETE" }),
  );
}

export async function addCourseTopic(id: string, input: { title: string }) {
  return parseJson<{ topic: TopicSummary }>(
    await fetch(`/api/learning/courses/${id}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateTopic(id: string, input: { completed?: boolean }) {
  return parseJson<{ topic: TopicSummary }>(
    await fetch(`/api/learning/topics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteTopic(id: string) {
  return parseJson<{ ok: boolean }>(
    await fetch(`/api/learning/topics/${id}`, { method: "DELETE" }),
  );
}

export async function listStudySessions(params?: { courseId?: string }) {
  const search = new URLSearchParams();
  if (params?.courseId) search.set("courseId", params.courseId);
  const query = search.toString();
  const url = query ? `/api/learning/sessions?${query}` : "/api/learning/sessions";

  return parseJson<{ sessions: StudySessionSummary[]; degraded?: boolean }>(
    await fetch(url, { cache: "no-store" }),
  );
}

export async function createStudySession(input: {
  courseId?: string | null;
  minutes: number;
  notes?: string | null;
  studiedAt?: string;
}) {
  return parseJson<{ session: StudySessionSummary }>(
    await fetch("/api/learning/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}
