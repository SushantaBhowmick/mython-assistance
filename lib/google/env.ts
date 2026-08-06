/** Optional Google Calendar OAuth env (Tasks → Calendar sync). */

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!id) throw new Error("GOOGLE_CLIENT_ID is not configured");
  return id;
}

export function getGoogleClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET is not configured");
  return secret;
}

/**
 * OAuth redirect URI for the current browser origin.
 * Prefer request origin so localhost connect does not send users to production.
 */
export function getGoogleRedirectUriForOrigin(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/integrations/google/callback`;
}

/** Fallback when no request origin is available (docs / scripts). */
export function getGoogleRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI?.trim()) {
    return process.env.GOOGLE_REDIRECT_URI.trim().replace(/\/$/, "");
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) {
    throw new Error("GOOGLE_REDIRECT_URI or NEXT_PUBLIC_APP_URL is required");
  }
  return `${appUrl.replace(/\/$/, "")}/api/integrations/google/callback`;
}

export function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto =
      forwardedProto?.split(",")[0]?.trim() ||
      (url.protocol === "https:" ? "https" : "http");
    return `${proto}://${forwardedHost.split(",")[0]!.trim()}`;
  }
  return url.origin;
}
