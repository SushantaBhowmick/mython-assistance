import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonOk } from "@/lib/api/response";
import { loadDashboardSummary } from "@/lib/dashboard/serialize";
import { safePrismaRead } from "@/lib/prisma/client";

export async function GET() {
  try {
    const userId = await getUserId();

    const { data, degraded } = await safePrismaRead(
      () => loadDashboardSummary(userId),
      {
        greeting: "Hello",
        focus: null,
        counts: {
          tasksToday: 0,
          tasksOverdue: 0,
          notes: 0,
          remindersUpcoming: 0,
          bookmarks: 0,
          learningActive: 0,
          applicationsActive: 0,
        },
        tasksToday: [],
        tasksOverdue: [],
        remindersNext: [],
        notesRecent: [],
        notesPinned: [],
        musicContinue: null,
      },
      "dashboard/summary",
    );

    return jsonOk({
      ...data,
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[dashboard/summary]");
  }
}
