import { Prisma } from "@prisma/client";

const TRANSIENT_ERROR_CODES = new Set(["P1001", "P1008", "P1017", "P2024"]);

export function isTransientPrismaError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_ERROR_CODES.has(error.code);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    return (
      error.message.includes("Can't reach database server") ||
      error.message.includes("Connection timed out") ||
      error.message.includes("ECONNRESET") ||
      error.message.includes("ETIMEDOUT")
    );
  }

  return false;
}

export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  options: { retries?: number; label?: string } = {},
): Promise<T> {
  const maxRetries = options.retries ?? 3;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientPrismaError(error) || attempt === maxRetries) {
        throw error;
      }

      const delayMs = 250 * 2 ** attempt;
      console.warn(
        `[prisma/retry] ${options.label ?? "query"} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

export async function safePrismaRead<T>(
  operation: () => Promise<T>,
  fallback: T,
  label?: string,
): Promise<{ data: T; degraded: boolean }> {
  try {
    const data = await withPrismaRetry(operation, { label });
    return { data, degraded: false };
  } catch (error) {
    if (!isTransientPrismaError(error)) {
      throw error;
    }

    console.warn(`[prisma/safe-read] ${label ?? "query"} unavailable, using fallback`);
    return { data: fallback, degraded: true };
  }
}
