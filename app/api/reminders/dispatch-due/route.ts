import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonOk } from "@/lib/api/response";
import { dispatchDueRemindersForUser } from "@/lib/notifications/dispatch-due-reminders";

export async function POST() {
  try {
    const userId = await getUserId();
    const result = await dispatchDueRemindersForUser(userId);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error, "[reminders/dispatch-due]");
  }
}
