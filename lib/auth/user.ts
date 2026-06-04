import { AppError } from "@/lib/errors/app-error";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** @deprecated Use getSessionUser — kept for migration scripts only */
export const TEMP_USER_ID = "local-dev-user";

export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "AuthError";
  }
}

export async function getSessionUser() {
  if (!isSupabaseConfigured()) {
    if (process.env.AUTH_DEV_BYPASS === "true") {
      return { id: TEMP_USER_ID, email: "dev@local.mython" };
    }
    throw new AuthError("Authentication is not configured");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError();
  }

  return user;
}

export async function getUserId(): Promise<string> {
  const user = await getSessionUser();
  return user.id;
}
