import "server-only";

import { findDueRemindersForUser } from "@/lib/dashboard/serialize";
import { sendPushNotification, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

export async function dispatchDueRemindersForUser(userId: string) {
  if (!isFirebaseAdminConfigured()) {
    return { sent: 0, skipped: "firebase_not_configured" as const };
  }

  const tokens = await prisma.notificationToken.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  if (tokens.length === 0) {
    return { sent: 0, skipped: "no_tokens" as const };
  }

  const due = await findDueRemindersForUser(userId);
  console.log(due)
  if (due.length === 0) {
    return { sent: 0, skipped: "none_due" as const };
  }

  let sent = 0;
  const token = tokens[0]!.token;

  for (const reminder of due) {
    try {
      await sendPushNotification({
        token,
        title: "Reminder",
        body: reminder.title,
        data: {
          type: "reminder",
          reminderId: reminder.id,
          href: "/reminders",
        },
      });

      await withPrismaRetry(() =>
        prisma.reminder.update({
          where: { id: reminder.id },
          data: { notifiedAt: new Date() },
        }),
      );
      sent += 1;
    } catch (error) {
      console.error("[reminders/dispatch]", reminder.id, error);
    }
  }

  return { sent, skipped: undefined };
}
