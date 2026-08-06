import { NextResponse } from "next/server";

import { NOTES_UNLOCK_COOKIE, notesUnlockCookieOptions } from "@/lib/notes/vault";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(NOTES_UNLOCK_COOKIE, "", notesUnlockCookieOptions(0));
  return response;
}
