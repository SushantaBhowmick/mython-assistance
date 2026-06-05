export type ApplicationStatus =
  | "WISHLIST"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";

export interface InterviewSummary {
  id: string;
  applicationId: string;
  scheduledAt: string;
  type: string | null;
  notes: string | null;
  company: string | null;
  role: string | null;
}

export interface JobApplicationSummary {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  jobUrl: string | null;
  location: string | null;
  salaryNote: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  interviewsCount: number;
  nextInterviewAt: string | null;
}

export interface JobApplicationDetail extends JobApplicationSummary {
  interviews: InterviewSummary[];
}
