import { google, type calendar_v3 } from "googleapis";

type CalendarAuth = InstanceType<typeof google.auth.OAuth2>;

const PRIMARY_CALENDAR = "primary";
const DEFAULT_DURATION_MS = 30 * 60 * 1000;

export interface TaskCalendarEventInput {
  title: string;
  description: string | null;
  dueAt: Date;
  status: string;
  taskUrl: string;
}

function getCalendar(auth: CalendarAuth) {
  // googleapis nests a separate google-auth-library copy; cast across the mismatch
  return google.calendar({ version: "v3", auth: auth as never });
}

function buildEventBody(input: TaskCalendarEventInput): calendar_v3.Schema$Event {
  const end = new Date(input.dueAt.getTime() + DEFAULT_DURATION_MS);
  const statusNote =
    input.status === "DONE"
      ? "Status: Done"
      : input.status === "CANCELLED"
        ? "Status: Cancelled"
        : input.status === "IN_PROGRESS"
          ? "Status: In progress"
          : null;

  const parts = [
    input.description?.trim() || null,
    statusNote,
    `Open in Mython: ${input.taskUrl}`,
  ].filter(Boolean);

  return {
    summary: input.title,
    description: parts.join("\n\n"),
    start: {
      dateTime: input.dueAt.toISOString(),
    },
    end: {
      dateTime: end.toISOString(),
    },
  };
}

export async function insertCalendarEvent(
  auth: CalendarAuth,
  input: TaskCalendarEventInput,
): Promise<string> {
  const calendar = getCalendar(auth);
  const { data } = await calendar.events.insert({
    calendarId: PRIMARY_CALENDAR,
    requestBody: buildEventBody(input),
  });
  if (!data.id) {
    throw new Error("Google Calendar insert did not return an event id");
  }
  return data.id;
}

export async function patchCalendarEvent(
  auth: CalendarAuth,
  eventId: string,
  input: TaskCalendarEventInput,
): Promise<void> {
  const calendar = getCalendar(auth);
  await calendar.events.patch({
    calendarId: PRIMARY_CALENDAR,
    eventId,
    requestBody: buildEventBody(input),
  });
}

export async function deleteCalendarEvent(
  auth: CalendarAuth,
  eventId: string,
): Promise<void> {
  const calendar = getCalendar(auth);
  try {
    await calendar.events.delete({
      calendarId: PRIMARY_CALENDAR,
      eventId,
    });
  } catch (error: unknown) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "number"
        ? (error as { code: number }).code
        : null;
    if (status === 404 || status === 410) return;
    throw error;
  }
}
