import { google } from "googleapis";

import {
  getGoogleClientId,
  getGoogleClientSecret,
  getGoogleRedirectUri,
} from "@/lib/google/env";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;

export function createGoogleOAuthClient() {
  return new google.auth.OAuth2(
    getGoogleClientId(),
    getGoogleClientSecret(),
    getGoogleRedirectUri(),
  );
}

export function getGoogleAuthUrl(state: string): string {
  const client = createGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [...GOOGLE_CALENDAR_SCOPES],
    state,
  });
}

export async function exchangeGoogleCode(code: string) {
  const client = createGoogleOAuthClient();
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
  const client = createGoogleOAuthClient();
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
