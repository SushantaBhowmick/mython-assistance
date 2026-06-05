import type { NoteSummary } from "@/modules/notes/types";
import type { ReminderSummary } from "@/modules/reminders/types";
import type { TaskSummary } from "@/modules/tasks/types";

export interface MusicContinue {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  lastPlayedAt: string;
}

export interface DashboardSummary {
  greeting: string;
  focus: string | null;
  counts: {
    tasksToday: number;
    tasksOverdue: number;
    notes: number;
    remindersUpcoming: number;
    bookmarks: number;
    learningActive: number;
    applicationsActive: number;
  };
  tasksToday: TaskSummary[];
  tasksOverdue: TaskSummary[];
  remindersNext: ReminderSummary[];
  notesRecent: NoteSummary[];
  notesPinned: NoteSummary[];
  musicContinue: MusicContinue | null;
  degraded?: boolean;
}
