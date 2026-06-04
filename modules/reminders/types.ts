export type ReminderStatus = "PENDING" | "DONE" | "SNOOZED";

export interface ReminderLink {
  taskId: string | null;
  noteId: string | null;
  taskTitle: string | null;
  noteTitle: string | null;
}

export interface ReminderSummary {
  id: string;
  title: string;
  remindAt: string;
  status: ReminderStatus;
  snoozedUntil: string | null;
  effectiveAt: string;
  createdAt: string;
  updatedAt: string;
  link: ReminderLink;
}

export interface ReminderDetail extends ReminderSummary {}
