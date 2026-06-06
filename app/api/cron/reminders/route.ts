import { NextResponse } from "next/server";

import { dispatchDueRemindersForUser } from "@/lib/notifications/dispatch-due-reminders";
import { prisma } from "@/lib/prisma/client";

function isCronAuthorized(request: Request, secret: string | undefined) {
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const cronHeader = request.headers.get("x-cron-secret");
  if (cronHeader === secret) return true;

  return false;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!isCronAuthorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerUserId = process.env.OWNER_USER_ID;
  let userId = ownerUserId ?? null;

  if (!userId) {
    const profile = await prisma.profile.findFirst({ select: { userId: true } });
    userId = profile?.userId ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "No owner user configured" }, { status: 404 });
  }

  const result = await dispatchDueRemindersForUser(userId);
  return NextResponse.json({ ok: true, ...result });
}
