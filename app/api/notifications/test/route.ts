import { getUserId } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/api/response";
import { sendPushNotification, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { testNotificationSchema } from "@/lib/notifications/schemas";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError("Firebase Admin is not configured", 503);
    }

    const body = await request.json();
    const parsed = testNotificationSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid request", 400);
    }

    const userId = await getUserId();

    let token = parsed.data.token;

    if (!token) {
      const latest = await prisma.notificationToken.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      if (!latest) {
        return jsonError("No registered notification token found", 404);
      }

      token = latest.token;
    }

    const messageId = await sendPushNotification({
      token,
      title: "Mython test notification",
      body: "Push notifications are working for your personal assistant PWA.",
      data: {
        type: "test",
      },
    });

    await prisma.notificationToken.updateMany({
      where: { token },
      data: { lastUsedAt: new Date() },
    });

    return jsonOk({ success: true, messageId });
  } catch (error) {
    console.error("[notifications/test]", error);
    const message =
      error instanceof Error ? error.message : "Failed to send test notification";
    return jsonError(message, 500);
  }
}
