import "server-only";

const lastBriefByUser = new Map<string, number>();
const MIN_INTERVAL_MS = 60_000;

export function canGenerateBrief(userId: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const last = lastBriefByUser.get(userId) ?? 0;
  const elapsed = Date.now() - last;
  if (elapsed < MIN_INTERVAL_MS) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((MIN_INTERVAL_MS - elapsed) / 1000),
    };
  }
  return { ok: true };
}

export function markBriefGenerated(userId: string) {
  lastBriefByUser.set(userId, Date.now());
}
