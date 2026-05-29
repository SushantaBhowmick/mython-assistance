import "server-only";

import { prisma } from "@/lib/prisma/client";

const QUOTA_STATE_ID = "default";
const LIVE_SEARCH_COOLDOWN_HOURS = 24;

const memoryState = {
  lastQuotaErrorAt: null as Date | null,
  liveSearchDisabledUntil: null as Date | null,
  estimatedSearchCallsToday: 0,
  searchCallsDate: null as Date | null,
};

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function getOrCreateState() {
  try {
    return await prisma.youTubeQuotaState.upsert({
      where: { id: QUOTA_STATE_ID },
      create: { id: QUOTA_STATE_ID },
      update: {},
    });
  } catch (error) {
    console.warn("[youtube/quota-state] DB unavailable, using memory fallback:", error);
    return {
      id: QUOTA_STATE_ID,
      lastQuotaErrorAt: memoryState.lastQuotaErrorAt,
      liveSearchDisabledUntil: memoryState.liveSearchDisabledUntil,
      estimatedSearchCallsToday: memoryState.estimatedSearchCallsToday,
      searchCallsDate: memoryState.searchCallsDate,
      updatedAt: new Date(),
    };
  }
}

export async function isLiveSearchDisabled(): Promise<boolean> {
  const state = await getOrCreateState();
  if (!state.liveSearchDisabledUntil) return false;
  return state.liveSearchDisabledUntil > new Date();
}

export async function recordLiveSearchAttempt(): Promise<void> {
  const today = startOfUtcDay();
  const state = await getOrCreateState();
  const sameDay =
    state.searchCallsDate &&
    startOfUtcDay(state.searchCallsDate).getTime() === today.getTime();
  const nextCount = sameDay ? state.estimatedSearchCallsToday + 1 : 1;

  memoryState.estimatedSearchCallsToday = nextCount;
  memoryState.searchCallsDate = today;

  try {
    await prisma.youTubeQuotaState.update({
      where: { id: QUOTA_STATE_ID },
      data: {
        estimatedSearchCallsToday: nextCount,
        searchCallsDate: today,
      },
    });
  } catch {
    // Memory fallback already updated.
  }
}

export async function recordQuotaError(): Promise<void> {
  const now = new Date();
  const disabledUntil = new Date(now);
  disabledUntil.setHours(disabledUntil.getHours() + LIVE_SEARCH_COOLDOWN_HOURS);

  memoryState.lastQuotaErrorAt = now;
  memoryState.liveSearchDisabledUntil = disabledUntil;

  try {
    await prisma.youTubeQuotaState.upsert({
      where: { id: QUOTA_STATE_ID },
      create: {
        id: QUOTA_STATE_ID,
        lastQuotaErrorAt: now,
        liveSearchDisabledUntil: disabledUntil,
      },
      update: {
        lastQuotaErrorAt: now,
        liveSearchDisabledUntil: disabledUntil,
      },
    });
  } catch {
    // Memory fallback already updated.
  }
}

export async function getQuotaStatus() {
  const state = await getOrCreateState();
  const liveSearchDisabled = await isLiveSearchDisabled();

  return {
    estimatedSearchCallsToday: state.estimatedSearchCallsToday,
    liveSearchDisabled,
    quotaFallbackActive: liveSearchDisabled,
    lastQuotaErrorAt: state.lastQuotaErrorAt?.toISOString() ?? null,
    liveSearchDisabledUntil: state.liveSearchDisabledUntil?.toISOString() ?? null,
    cooldownHours: LIVE_SEARCH_COOLDOWN_HOURS,
  };
}
