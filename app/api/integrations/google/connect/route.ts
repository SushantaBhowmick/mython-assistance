import { NextResponse } from "next/server";

import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError } from "@/lib/api/response";
import {
  createAndStoreOAuthState,
  getGoogleAuthUrl,
} from "@/lib/google/calendar-oauth";
import {
  getGoogleRedirectUriForOrigin,
  getRequestOrigin,
  isGoogleCalendarConfigured,
} from "@/lib/google/env";

export async function GET(request: Request) {
  try {
    if (!isGoogleCalendarConfigured()) {
      return jsonError(
        "Google Calendar is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        503,
        "GOOGLE_NOT_CONFIGURED",
      );
    }

    const userId = await getUserId();
    const origin = getRequestOrigin(request);
    const redirectUri = getGoogleRedirectUriForOrigin(origin);
    const state = await createAndStoreOAuthState(userId, redirectUri);
    const url = getGoogleAuthUrl(state, redirectUri);

    console.info("[integrations/google/connect]", {
      userId,
      origin,
      redirectUri,
      stateLen: state.length,
    });

    return NextResponse.redirect(url);
  } catch (error) {
    return handleRouteError(error, "[integrations/google/connect]");
  }
}
