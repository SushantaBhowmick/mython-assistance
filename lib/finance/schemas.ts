import { z } from "zod";

const transactionType = z.enum(["EXPENSE", "INCOME"]);

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format");

const amountSchema = z.union([z.string(), z.number()]).transform((value) => String(value).trim());

export const createTransactionSchema = z.object({
  type: transactionType,
  amount: amountSchema.refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Invalid amount"),
  categoryId: z.string().cuid().optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  occurredAt: z.string().datetime({ offset: true }),
});

export const updateTransactionSchema = z.object({
  type: transactionType.optional(),
  amount: amountSchema
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Invalid amount")
    .optional(),
  categoryId: z.string().cuid().optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});

export const listTransactionsQuerySchema = z.object({
  month: monthSchema.optional(),
  type: transactionType.optional(),
});

export const financeSummaryQuerySchema = z.object({
  month: monthSchema.optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  icon: z.string().trim().max(32).optional().nullable(),
  type: transactionType,
});
