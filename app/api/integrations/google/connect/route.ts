import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError } from "@/lib/api/response";
import { getGoogleAuthUrl } from "@/lib/google/calendar-oauth";
import { isGoogleCalendarConfigured } from "@/lib/google/env";

export async function GET() {
  try {
    if (!isGoogleCalendarConfigured()) {
      return jsonError(
        "Google Calendar is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        503,
        "GOOGLE_NOT_CONFIGURED",
      );
    }

    const userId = await getUserId();
    const nonce = randomBytes(16).toString("hex");
    const state = Buffer.from(JSON.stringify({ userId, nonce })).toString(
      "base64url",
    );

    const url = getGoogleAuthUrl(state);
    const response = NextResponse.redirect(url);
    response.cookies.set("gcal_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
    return response;
  } catch (error) {
    return handleRouteError(error, "[integrations/google/connect]");
  }
}
