import type {
  InterviewSummary,
  JobApplicationDetail,
  JobApplicationSummary,
} from "@/modules/career/types";
import type { Interview, JobApplication, Prisma } from "@prisma/client";

type ApplicationWithInterviews = JobApplication & {
  interviews: Interview[];
};

type InterviewWithApplication = Interview & {
  application?: { id: string; company: string; role: string } | null;
};

export const applicationInclude = {
  interviews: {
    orderBy: { scheduledAt: "asc" as const },
  },
} satisfies Prisma.JobApplicationInclude;

export function serializeInterview(interview: InterviewWithApplication): InterviewSummary {
  return {
    id: interview.id,
    applicationId: interview.applicationId,
    scheduledAt: interview.scheduledAt.toISOString(),
    type: interview.type,
    notes: interview.notes,
    company: interview.application?.company ?? null,
    role: interview.application?.role ?? null,
  };
}

export function serializeApplicationSummary(
  application: ApplicationWithInterviews,
): JobApplicationSummary {
  const now = Date.now();
  const nextInterview = application.interviews.find(
    (interview) => interview.scheduledAt.getTime() >= now,
  );

  return {
    id: application.id,
    company: application.company,
    role: application.role,
    status: application.status,
    jobUrl: application.jobUrl,
    location: application.location,
    salaryNote: application.salaryNote,
    appliedAt: application.appliedAt?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    interviewsCount: application.interviews.length,
    nextInterviewAt: nextInterview?.scheduledAt.toISOString() ?? null,
  };
}

export function serializeApplicationDetail(application: ApplicationWithInterviews): JobApplicationDetail {
  return {
    ...serializeApplicationSummary(application),
    interviews: application.interviews.map((interview) => serializeInterview(interview)),
  };
}

export function buildApplicationListWhere(
  userId: string,
  params: { q?: string; status?: JobApplication["status"] },
): Prisma.JobApplicationWhereInput {
  const { q, status } = params;

  return {
    userId,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { company: { contains: q, mode: "insensitive" as const } },
            { role: { contains: q, mode: "insensitive" as const } },
            { location: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}
