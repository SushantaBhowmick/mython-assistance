export class YouTubeSearchError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly reason?: string,
  ) {
    super(message);
    this.name = "YouTubeSearchError";
  }
}

const LIMIT_REASONS = new Set(["quotaExceeded", "rateLimitExceeded"]);

export function isYouTubeLimitError(error: unknown): boolean {
  if (!(error instanceof YouTubeSearchError)) return false;
  if (error.reason && LIMIT_REASONS.has(error.reason)) return true;
  return error.status === 429 || error.status === 403;
}

/** @deprecated Use isYouTubeLimitError */
export const isYouTubeQuotaError = isYouTubeLimitError;

export function parseYouTubeSearchError(status: number, body: string): YouTubeSearchError {
  try {
    const parsed = JSON.parse(body) as {
      error?: { errors?: { reason?: string }[]; message?: string };
    };
    const reason = parsed.error?.errors?.[0]?.reason;
    const message = parsed.error?.message ?? `YouTube search failed (${status})`;
    return new YouTubeSearchError(message, status, reason);
  } catch {
    return new YouTubeSearchError(`YouTube search failed (${status}): ${body}`, status);
  }
}
