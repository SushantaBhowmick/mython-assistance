import { z } from "zod";

export const parseCommandAiSchema = z.object({
  input: z.string().trim().min(1).max(500),
});
