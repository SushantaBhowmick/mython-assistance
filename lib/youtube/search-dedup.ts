import "server-only";

import { normalizeSearchQuery } from "@/lib/music/normalize";

const RECENT_TTL_MS = 5 * 60 * 1000;

const inflight = new Map<string, Promise<unknown>>();
const recent = new Map<string, { at: number; value: unknown }>();

export function dedupeSearchRequest<T>(query: string, run: () => Promise<T>): Promise<T> {
  const key = normalizeSearchQuery(query);

  const cached = recent.get(key);
  if (cached && Date.now() - cached.at < RECENT_TTL_MS) {
    return Promise.resolve(cached.value as T);
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = run()
    .then((value) => {
      recent.set(key, { at: Date.now(), value });
      inflight.delete(key);
      return value;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, promise);
  return promise;
}

export function clearSearchDedupeCache(query?: string) {
  if (!query) {
    inflight.clear();
    recent.clear();
    return;
  }

  const key = normalizeSearchQuery(query);
  inflight.delete(key);
  recent.delete(key);
}
