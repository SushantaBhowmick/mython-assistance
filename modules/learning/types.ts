export type CourseStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";

export interface TopicSummary {
  id: string;
  courseId: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  platform: string | null;
  sourceUrl: string | null;
  status: CourseStatus;
  completedTopics: number;
  totalTopics: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetail extends CourseSummary {
  topics: TopicSummary[];
}

export interface StudySessionSummary {
  id: string;
  courseId: string | null;
  courseTitle: string | null;
  minutes: number;
  notes: string | null;
  studiedAt: string;
}
