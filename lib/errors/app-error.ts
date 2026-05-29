export class AppError extends Error {
  constructor(
    message: string,
    readonly status = 500,
    readonly code = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function getErrorStatus(error: unknown): number {
  if (error instanceof AppError) return error.status;
  return 500;
}

export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) return error.code;
  return "INTERNAL_ERROR";
}
