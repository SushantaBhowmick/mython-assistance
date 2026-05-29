import { getUserId } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/api/response";
import { registerNotificationSchema } from "@/lib/notifications/schemas";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerNotificationSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid token payload", 400);
    }

    const userId = await getUserId();

    const record = await prisma.notificationToken.upsert({
      where: { token: parsed.data.token },
      create: {
        userId,
        token: parsed.data.token,
        platform: parsed.data.platform,
        userAgent: parsed.data.userAgent,
        lastUsedAt: new Date(),
      },
      update: {
        userId,
        platform: parsed.data.platform,
        userAgent: parsed.data.userAgent,
        lastUsedAt: new Date(),
      },
    });

    return jsonOk({
      token: {
        id: record.id,
        platform: record.platform,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[notifications/register]", error);
    return jsonError("Failed to register notification token", 500);
  }
}

export async function GET() {
  try {
    const userId = await getUserId();

    const tokens = await prisma.notificationToken.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return jsonOk({
      tokens: tokens.map((token) => ({
        id: token.id,
        platform: token.platform,
        createdAt: token.createdAt.toISOString(),
        updatedAt: token.updatedAt.toISOString(),
        lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("[notifications/register/get]", error);
    return jsonError("Failed to load notification tokens", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerNotificationSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid token payload", 400);
    }

    const userId = await getUserId();

    await prisma.notificationToken.deleteMany({
      where: { userId, token: parsed.data.token },
    });

    return jsonOk({ success: true });
  } catch (error) {
    console.error("[notifications/register/delete]", error);
    return jsonError("Failed to delete notification token", 500);
  }
}
