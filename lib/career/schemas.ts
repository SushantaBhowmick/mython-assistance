import { z } from "zod";

const applicationStatus = z.enum([
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
]);

export const createApplicationSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(200),
  role: z.string().trim().min(1, "Role is required").max(200),
  status: applicationStatus.optional().default("WISHLIST"),
  jobUrl: z.string().url("Job URL must be valid").optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  salaryNote: z.string().trim().max(300).optional().nullable(),
  appliedAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const updateApplicationSchema = z.object({
  company: z.string().trim().min(1).max(200).optional(),
  role: z.string().trim().min(1).max(200).optional(),
  status: applicationStatus.optional(),
  jobUrl: z.string().url("Job URL must be valid").optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  salaryNote: z.string().trim().max(300).optional().nullable(),
  appliedAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const listApplicationsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: applicationStatus.optional(),
});

export const createInterviewSchema = z.object({
  applicationId: z.string().cuid(),
  scheduledAt: z.string().datetime({ offset: true }),
  type: z.string().trim().max(120).optional().nullable(),
  notes: z.string().max(10_000).optional().nullable(),
});
