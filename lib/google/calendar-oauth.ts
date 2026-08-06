import { randomBytes } from "crypto";
import { google } from "googleapis";

import {
  getGoogleClientId,
  getGoogleClientSecret,
} from "@/lib/google/env";
import { prisma } from "@/lib/prisma/client";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export function createGoogleOAuthClient(redirectUri: string) {
  return new google.auth.OAuth2(
    getGoogleClientId(),
    getGoogleClientSecret(),
    redirectUri,
  );
}

/** Hex-only state stored in DB — avoids cookie + URL encoding issues. */
export async function createAndStoreOAuthState(
  userId: string,
  redirectUri: string,
): Promise<string> {
  const state = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS);

  await prisma.googleOAuthPending.upsert({
    where: { userId },
    create: { userId, state, redirectUri, expiresAt },
    update: { state, redirectUri, expiresAt },
  });

  return state;
}

export async function consumeOAuthState(
  userId: string,
  state: string,
): Promise<
  | { ok: true; redirectUri: string }
  | { ok: false; reason: string }
> {
  if (!state || !/^[a-f0-9]{48}$/i.test(state)) {
    return { ok: false, reason: "invalid_state_format" };
  }

  const pending = await prisma.googleOAuthPending.findUnique({
    where: { userId },
  });

  if (!pending) {
    return { ok: false, reason: "no_pending_state" };
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await prisma.googleOAuthPending.delete({ where: { userId } }).catch(() => {});
    return { ok: false, reason: "state_expired" };
  }

  if (pending.state !== state) {
    return { ok: false, reason: "state_mismatch" };
  }

  const redirectUri = pending.redirectUri;
  if (!redirectUri) {
    await prisma.googleOAuthPending.delete({ where: { userId } }).catch(() => {});
    return { ok: false, reason: "no_pending_state" };
  }

  await prisma.googleOAuthPending.delete({ where: { userId } }).catch(() => {});
  return { ok: true, redirectUri };
}

export function getGoogleAuthUrl(state: string, redirectUri: string): string {
  const client = createGoogleOAuthClient(redirectUri);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [...GOOGLE_CALENDAR_SCOPES],
    state,
  });
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const client = createGoogleOAuthClient(redirectUri);
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token) {
    throw new Error("Google OAuth did not return an access token");
  }

  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client as never });
  const { data } = await oauth2.userinfo.get();
  const googleEmail = data.email;
  if (!googleEmail) {
    throw new Error("Google OAuth did not return an email address");
  }

  return {
    googleEmail,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
}

export async function refreshConnectionTokens(connection: {
  id: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date | null;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date | null;
}> {
  // Redirect URI is unused for refresh; pass a placeholder matching env fallback.
  const client = createGoogleOAuthClient("https://localhost/oauth-refresh");
  client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.tokenExpiry?.getTime(),
  });

  const { credentials } = await client.refreshAccessToken();
  return {
    accessToken: credentials.access_token ?? connection.accessToken,
    refreshToken: credentials.refresh_token ?? connection.refreshToken,
    tokenExpiry: credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : connection.tokenExpiry,
  };
}
