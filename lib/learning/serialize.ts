import type { CourseDetail, CourseSummary, StudySessionSummary, TopicSummary } from "@/modules/learning/types";
import type { Prisma, StudySession, Topic } from "@prisma/client";

type CourseWithTopics = Prisma.CourseGetPayload<{
  include: { topics: true };
}>;

type StudySessionWithCourse = StudySession & {
  course?: { id: string; title: string } | null;
};

export const courseInclude = {
  topics: { orderBy: { position: "asc" as const } },
} satisfies Prisma.CourseInclude;

export function serializeTopic(topic: Topic): TopicSummary {
  return {
    id: topic.id,
    courseId: topic.courseId,
    title: topic.title,
    completed: topic.completed,
    position: topic.position,
  };
}

export function serializeCourseSummary(course: CourseWithTopics): CourseSummary {
  const totalTopics = course.topics.length;
  const completedTopics = course.topics.filter((topic) => topic.completed).length;

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    platform: course.platform,
    sourceUrl: course.sourceUrl,
    status: course.status,
    completedTopics,
    totalTopics,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };
}

export function serializeCourseDetail(course: CourseWithTopics): CourseDetail {
  return {
    ...serializeCourseSummary(course),
    topics: course.topics.map(serializeTopic),
  };
}

export function serializeStudySession(session: StudySessionWithCourse): StudySessionSummary {
  return {
    id: session.id,
    courseId: session.courseId,
    courseTitle: session.course?.title ?? null,
    minutes: session.minutes,
    notes: session.notes,
    studiedAt: session.studiedAt.toISOString(),
  };
}

export function buildCourseListWhere(
  userId: string,
  params: { q?: string; status?: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED" },
): Prisma.CourseWhereInput {
  const { q, status } = params;

  return {
    userId,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { platform: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}
