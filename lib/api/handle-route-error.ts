import { jsonError } from "@/lib/api/response";
import {
  AppError,
  getErrorCode,
  getErrorMessage,
  getErrorStatus,
} from "@/lib/errors/app-error";

export function handleRouteError(error: unknown, logLabel: string) {
  if (!(error instanceof AppError)) {
    console.error(logLabel, error);
  }

  const status = getErrorStatus(error);
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  return jsonError(message, status, code);
}

export function assertCondition(
  condition: unknown,
  message: string,
  status = 400,
  code = "BAD_REQUEST",
): asserts condition {
  if (!condition) {
    throw new AppError(message, status, code);
  }
}
