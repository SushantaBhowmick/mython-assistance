import { NextResponse } from "next/server";

import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { serializeProfile } from "@/lib/profile/serialize";
import { prisma } from "@/lib/prisma/client";
import { withPrismaRetry } from "@/lib/prisma/retry";

export async function GET() {
  try {
    const userId = await getUserId();

    const profile = await withPrismaRetry(() =>
      prisma.profile.findUnique({ where: { userId } }),
    );

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile: serializeProfile(profile) });
  } catch (error) {
    return handleRouteError(error, "[profile/get]");
  }
}
