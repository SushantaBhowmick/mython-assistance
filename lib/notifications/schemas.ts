import { z } from "zod";

export const registerNotificationSchema = z.object({
  token: z.string().min(1),
  platform: z.string().optional(),
  userAgent: z.string().optional(),
});

export const testNotificationSchema = z.object({
  token: z.string().min(1).optional(),
});
