import "server-only";

import { prisma } from "@/lib/prisma/client";

export async function resolveOwnerUserId(): Promise<string | null> {
  const fromEnv = process.env.OWNER_USER_ID?.trim();
  if (fromEnv) return fromEnv;

  const profile = await prisma.profile.findFirst({
    select: { userId: true },
    orderBy: { createdAt: "asc" },
  });

  return profile?.userId ?? null;
}
