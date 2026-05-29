/**
 * TODO: Replace with Supabase Auth session once login is implemented.
 * Temporary user id for local MVP testing only.
 */
export const TEMP_USER_ID = "local-dev-user";

export async function getUserId(): Promise<string> {
  // TODO: const supabase = await createServerClient(); return session.user.id
  return TEMP_USER_ID;
}
