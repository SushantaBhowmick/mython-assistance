import { NextResponse } from "next/server";

import { dispatchAutomationEvent } from "@/lib/automation/dispatch";
import { resolveOwnerUserId } from "@/lib/automation/owner";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

function verifyAutomationSecret(request: Request) {
  const secret = process.env.AUTOMATION_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!verifyAutomationSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await resolveOwnerUserId();
  if (!userId) {
    return NextResponse.json({ error: "No owner user configured" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = body as { event?: string; payload?: unknown };
  const eventName = parsed.event ?? "unknown";

  const result = await dispatchAutomationEvent(userId, body);

  await withPrismaRetry(() =>
    prisma.automationEvent.create({
      data: {
        userId,
        event: eventName,
        payload: (parsed.payload ?? body) as object,
        status: result.ok ? "processed" : "failed",
      },
    }),
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error, event: result.event }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    event: result.event,
    resourceId: result.resourceId,
    href: result.href,
  });
}
