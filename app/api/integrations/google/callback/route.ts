import { NextResponse } from "next/server";

import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import {
  consumeOAuthState,
  exchangeGoogleCode,
} from "@/lib/google/calendar-oauth";
import { getAppBaseUrl, isGoogleCalendarConfigured } from "@/lib/google/env";
import { prisma } from "@/lib/prisma/client";

function settingsRedirect(request: Request, query: string) {
  try {
    const url = new URL(request.url);
    return NextResponse.redirect(
      `${url.origin}/settings/integrations?${query}`,
    );
  } catch {
    return NextResponse.redirect(
      `${getAppBaseUrl()}/settings/integrations?${query}`,
    );
  }
}

export async function GET(request: Request) {
  try {
    if (!isGoogleCalendarConfigured()) {
      return settingsRedirect(request, "google=error&reason=not_configured");
    }

    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    console.info("[integrations/google/callback]", {
      userId,
      origin: new URL(request.url).origin,
      hasCode: Boolean(code),
      statePreview: state ? `${state.slice(0, 8)}…(${state.length})` : null,
      oauthError,
    });

    if (oauthError) {
      return settingsRedirect(
        request,
        `google=error&reason=${encodeURIComponent(oauthError)}`,
      );
    }

    if (!code || !state) {
      return settingsRedirect(request, "google=error&reason=missing_code");
    }

    const verified = await consumeOAuthState(userId, state);
    if (!verified.ok) {
      console.warn(
        "[integrations/google/callback] state rejected",
        verified.reason,
      );
      return settingsRedirect(
        request,
        `google=error&reason=${verified.reason}`,
      );
    }

    const tokens = await exchangeGoogleCode(code, verified.redirectUri);

    const existing = await prisma.googleCalendarConnection.findUnique({
      where: { userId },
      select: { refreshToken: true },
    });
    const refreshToken = tokens.refreshToken ?? existing?.refreshToken;
    if (!refreshToken) {
      return settingsRedirect(
        request,
        "google=error&reason=missing_refresh_token",
      );
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

    console.info(
      "[integrations/google/callback] connected",
      tokens.googleEmail,
    );
    return settingsRedirect(request, "google=connected");
  } catch (error) {
    console.error("[integrations/google/callback]", error);
    try {
      return settingsRedirect(request, "google=error&reason=exchange_failed");
    } catch {
      return handleRouteError(error, "[integrations/google/callback]");
    }
  }
}
