import type { InterviewSummary, JobApplicationDetail, JobApplicationSummary } from "@/modules/career/types";

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

export async function listApplications(params?: {
  q?: string;
  status?: JobApplicationSummary["status"];
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.status) search.set("status", params.status);
  const query = search.toString();
  const url = query ? `/api/career/applications?${query}` : "/api/career/applications";

  return parseJson<{ applications: JobApplicationSummary[]; degraded?: boolean }>(
    await fetch(url, { cache: "no-store" }),
  );
}

export async function getApplication(id: string) {
  return parseJson<{ application: JobApplicationDetail }>(
    await fetch(`/api/career/applications/${id}`, { cache: "no-store" }),
  );
}

export async function createApplication(input: {
  company: string;
  role: string;
  status?: JobApplicationSummary["status"];
  jobUrl?: string | null;
  location?: string | null;
  salaryNote?: string | null;
  appliedAt?: string | null;
}) {
  return parseJson<{ application: JobApplicationDetail }>(
    await fetch("/api/career/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateApplication(
  id: string,
  input: Partial<{
    company: string;
    role: string;
    status: JobApplicationSummary["status"];
    jobUrl: string | null;
    location: string | null;
    salaryNote: string | null;
    appliedAt: string | null;
  }>,
) {
  return parseJson<{ application: JobApplicationDetail }>(
    await fetch(`/api/career/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteApplication(id: string) {
  return parseJson<{ ok: boolean }>(
    await fetch(`/api/career/applications/${id}`, { method: "DELETE" }),
  );
}

export async function listInterviews() {
  return parseJson<{ interviews: InterviewSummary[]; degraded?: boolean }>(
    await fetch("/api/career/interviews", { cache: "no-store" }),
  );
}

export async function createInterview(input: {
  applicationId: string;
  scheduledAt: string;
  type?: string | null;
  notes?: string | null;
}) {
  return parseJson<{ interview: InterviewSummary }>(
    await fetch("/api/career/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}
