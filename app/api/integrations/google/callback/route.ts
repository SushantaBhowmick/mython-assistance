import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { exchangeGoogleCode } from "@/lib/google/calendar-oauth";
import { getAppBaseUrl, isGoogleCalendarConfigured } from "@/lib/google/env";
import { prisma } from "@/lib/prisma/client";

function settingsRedirect(query: string) {
  return NextResponse.redirect(
    `${getAppBaseUrl()}/settings/integrations?${query}`,
  );
}

export async function GET(request: Request) {
  try {
    if (!isGoogleCalendarConfigured()) {
      return settingsRedirect("google=error&reason=not_configured");
    }

    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      return settingsRedirect(`google=error&reason=${encodeURIComponent(oauthError)}`);
    }

    if (!code || !state) {
      return settingsRedirect("google=error&reason=missing_code");
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get("gcal_oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return settingsRedirect("google=error&reason=invalid_state");
    }

    let parsed: { userId?: string };
    try {
      parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
        userId?: string;
      };
    } catch {
      return settingsRedirect("google=error&reason=invalid_state");
    }

    if (parsed.userId !== userId) {
      return settingsRedirect("google=error&reason=user_mismatch");
    }

    const tokens = await exchangeGoogleCode(code);

    const existing = await prisma.googleCalendarConnection.findUnique({
      where: { userId },
      select: { refreshToken: true },
    });
    const refreshToken = tokens.refreshToken ?? existing?.refreshToken;
    if (!refreshToken) {
      return settingsRedirect("google=error&reason=missing_refresh_token");
    }

    await prisma.googleCalendarConnection.upsert({
      where: { userId },
      create: {
        userId,
        googleEmail: tokens.googleEmail,
        accessToken: tokens.accessToken,
        refreshToken,
        tokenExpiry: tokens.tokenExpiry,
      },
      update: {
        googleEmail: tokens.googleEmail,
        accessToken: tokens.accessToken,
        refreshToken,
        tokenExpiry: tokens.tokenExpiry,
      },
    });

    const response = settingsRedirect("google=connected");
    response.cookies.set("gcal_oauth_state", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("[integrations/google/callback]", error);
    try {
      return settingsRedirect("google=error&reason=exchange_failed");
    } catch {
      return handleRouteError(error, "[integrations/google/callback]");
    }
  }
}
