import { z } from "zod";

export const updateDashboardFocusSchema = z.object({
  focus: z.string().trim().max(200).nullable(),
});
