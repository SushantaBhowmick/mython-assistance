import type { Task } from "@prisma/client";

import {
  deleteCalendarEvent,
  insertCalendarEvent,
  patchCalendarEvent,
} from "@/lib/google/calendar-client";
import {
  createGoogleOAuthClient,
  refreshConnectionTokens,
} from "@/lib/google/calendar-oauth";
import { getAppBaseUrl, isGoogleCalendarConfigured } from "@/lib/google/env";
import { prisma } from "@/lib/prisma/client";

async function getConnectionAuth(userId: string) {
  if (!isGoogleCalendarConfigured()) return null;

  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
  });
  if (!connection) return null;

  let accessToken = connection.accessToken;
  let refreshToken = connection.refreshToken;
  let tokenExpiry = connection.tokenExpiry;

  const needsRefresh =
    !tokenExpiry || tokenExpiry.getTime() <= Date.now() + 60_000;

  if (needsRefresh) {
    try {
      const refreshed = await refreshConnectionTokens(connection);
      accessToken = refreshed.accessToken;
      refreshToken = refreshed.refreshToken;
      tokenExpiry = refreshed.tokenExpiry;
      await prisma.googleCalendarConnection.update({
        where: { id: connection.id },
        data: { accessToken, refreshToken, tokenExpiry },
      });
    } catch (error) {
      console.error("[google/calendar] token refresh failed", error);
      return null;
    }
  }

  // Redirect URI is unused for API calls with stored credentials.
  const auth = createGoogleOAuthClient("https://localhost/oauth-refresh");
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: tokenExpiry?.getTime(),
  });

  return { auth, connection };
}

function taskEventInput(task: Task) {
  if (!task.dueAt) return null;
  return {
    title: task.title,
    description: task.description,
    dueAt: task.dueAt,
    status: task.status,
    taskUrl: `${getAppBaseUrl()}/tasks/${task.id}`,
  };
}

/**
 * One-way sync: Mython task → Google Calendar.
 * Never throws to callers — task CRUD must not fail on Calendar errors.
 */
export async function syncTaskToGoogleCalendar(task: Task): Promise<void> {
  try {
    const ctx = await getConnectionAuth(task.userId);
    if (!ctx) return;

    const { auth } = ctx;
    const input = taskEventInput(task);

    if (!input) {
      if (task.googleCalendarEventId) {
        await deleteCalendarEvent(auth, task.googleCalendarEventId);
        await prisma.task.update({
          where: { id: task.id },
          data: {
            googleCalendarEventId: null,
            googleCalendarSyncedAt: null,
          },
        });
      }
      return;
    }

    if (task.googleCalendarEventId) {
      try {
        await patchCalendarEvent(auth, task.googleCalendarEventId, input);
        await prisma.task.update({
          where: { id: task.id },
          data: { googleCalendarSyncedAt: new Date() },
        });
        return;
      } catch (error) {
        console.error(
          "[google/calendar] patch failed; recreating event",
          task.id,
          error,
        );
      }
    }

    const eventId = await insertCalendarEvent(auth, input);
    await prisma.task.update({
      where: { id: task.id },
      data: {
        googleCalendarEventId: eventId,
        googleCalendarSyncedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[google/calendar] sync failed", task.id, error);
  }
}

/** Delete Calendar event for a task that is being removed. */
export async function removeTaskFromGoogleCalendar(task: Task): Promise<void> {
  if (!task.googleCalendarEventId) return;
  try {
    const ctx = await getConnectionAuth(task.userId);
    if (!ctx) return;
    await deleteCalendarEvent(ctx.auth, task.googleCalendarEventId);
  } catch (error) {
    console.error("[google/calendar] delete on task remove failed", task.id, error);
  }
}

/** On disconnect: remove all known linked events for this user, then clear ids. */
export async function cleanupGoogleCalendarEventsForUser(
  userId: string,
): Promise<void> {
  try {
    const ctx = await getConnectionAuth(userId);
    if (!ctx) {
      await prisma.task.updateMany({
        where: { userId, googleCalendarEventId: { not: null } },
        data: { googleCalendarEventId: null, googleCalendarSyncedAt: null },
      });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { userId, googleCalendarEventId: { not: null } },
      select: { id: true, googleCalendarEventId: true },
    });

    for (const task of tasks) {
      if (!task.googleCalendarEventId) continue;
      try {
        await deleteCalendarEvent(ctx.auth, task.googleCalendarEventId);
      } catch (error) {
        console.error(
          "[google/calendar] cleanup event failed",
          task.id,
          error,
        );
      }
    }

    await prisma.task.updateMany({
      where: { userId, googleCalendarEventId: { not: null } },
      data: { googleCalendarEventId: null, googleCalendarSyncedAt: null },
    });
  } catch (error) {
    console.error("[google/calendar] cleanup for user failed", userId, error);
  }
}
