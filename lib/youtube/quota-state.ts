import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

const QUOTA_CACHE_KEY = "__mython_quota_state__";
const LIVE_SEARCH_COOLDOWN_HOURS = 24;

interface QuotaStateData {
  lastQuotaErrorAt: string | null;
  liveSearchDisabledUntil: string | null;
  estimatedSearchCallsToday: number;
  searchCallsDate: string | null;
}

const defaultState = (): QuotaStateData => ({
  lastQuotaErrorAt: null,
  liveSearchDisabledUntil: null,
  estimatedSearchCallsToday: 0,
  searchCallsDate: null,
});

let memoryState: QuotaStateData = defaultState();

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseState(raw: unknown): QuotaStateData {
  if (!raw || typeof raw !== "object") return defaultState();
  const value = raw as Partial<QuotaStateData>;
  return {
    lastQuotaErrorAt: value.lastQuotaErrorAt ?? null,
    liveSearchDisabledUntil: value.liveSearchDisabledUntil ?? null,
    estimatedSearchCallsToday: value.estimatedSearchCallsToday ?? 0,
    searchCallsDate: value.searchCallsDate ?? null,
  };
}

async function loadState(): Promise<QuotaStateData> {
  try {
    const row = await prisma.youTubeCache.findUnique({
      where: { query: QUOTA_CACHE_KEY },
    });

    if (row) {
      const parsed = parseState(row.results);
      memoryState = parsed;
      return parsed;
    }
  } catch (error) {
    console.warn("[youtube/quota-state] load failed, using memory fallback:", error);
  }

  return memoryState;
}

async function saveState(state: QuotaStateData): Promise<void> {
  memoryState = state;

  try {
    const expiresAt = new Date("2099-01-01T00:00:00.000Z");
    await prisma.youTubeCache.upsert({
      where: { query: QUOTA_CACHE_KEY },
      create: {
        query: QUOTA_CACHE_KEY,
        results: state as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
      update: {
        results: state as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.warn("[youtube/quota-state] save failed, keeping memory fallback:", error);
  }
}

export async function isLiveSearchDisabled(): Promise<boolean> {
  const state = await loadState();
  if (!state.liveSearchDisabledUntil) return false;
  return new Date(state.liveSearchDisabledUntil) > new Date();
}

export async function recordLiveSearchAttempt(): Promise<void> {
  const today = startOfUtcDay();
  const state = await loadState();
  const sameDay =
    state.searchCallsDate &&
    startOfUtcDay(new Date(state.searchCallsDate)).getTime() === today.getTime();

  await saveState({
    ...state,
    estimatedSearchCallsToday: sameDay ? state.estimatedSearchCallsToday + 1 : 1,
    searchCallsDate: today.toISOString(),
  });
}

export async function recordQuotaError(): Promise<void> {
  const now = new Date();
  const disabledUntil = new Date(now);
  disabledUntil.setHours(disabledUntil.getHours() + LIVE_SEARCH_COOLDOWN_HOURS);

  const state = await loadState();
  await saveState({
    ...state,
    lastQuotaErrorAt: now.toISOString(),
    liveSearchDisabledUntil: disabledUntil.toISOString(),
  });
}

export async function getQuotaStatus() {
  const state = await loadState();
  const liveSearchDisabled = await isLiveSearchDisabled();

  return {
    estimatedSearchCallsToday: state.estimatedSearchCallsToday,
    liveSearchDisabled,
    quotaFallbackActive: liveSearchDisabled,
    lastQuotaErrorAt: state.lastQuotaErrorAt,
    liveSearchDisabledUntil: state.liveSearchDisabledUntil,
    cooldownHours: LIVE_SEARCH_COOLDOWN_HOURS,
  };
}
