import type { ReminderSummary } from "@/modules/reminders/types";
import type { TaskSummary } from "@/modules/tasks/types";

export interface DashboardSummary {
  greeting: string;
  counts: {
    tasksToday: number;
    tasksOverdue: number;
    notes: number;
    remindersUpcoming: number;
    bookmarks: number;
  };
  tasksToday: TaskSummary[];
  tasksOverdue: TaskSummary[];
  remindersNext: ReminderSummary[];
  degraded?: boolean;
}
