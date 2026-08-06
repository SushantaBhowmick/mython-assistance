import { z } from "zod";

import { getSessionUser } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  NOTES_PASSWORD_MIN_LENGTH,
  NOTES_UNLOCK_COOKIE,
  NOTES_UNLOCK_TTL_SECONDS,
  createNotesUnlockToken,
  getNotesPasswordHash,
  isNotesPasswordConfigured,
  isNotesUnlocked,
  notesUnlockCookieOptions,
  setNotesPasswordHash,
  verifyNotesPassword,
} from "@/lib/notes/vault";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const unlockSchema = z.object({
  password: z.string().min(1, "Notes password is required"),
});

const setupSchema = z
  .object({
    password: z
      .string()
      .min(NOTES_PASSWORD_MIN_LENGTH, `Notes password must be at least ${NOTES_PASSWORD_MIN_LENGTH} characters`),
    confirm: z.string().min(1, "Confirm your Notes password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Notes passwords do not match",
    path: ["confirm"],
  });

const changeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current Notes password is required"),
    password: z
      .string()
      .min(NOTES_PASSWORD_MIN_LENGTH, `Notes password must be at least ${NOTES_PASSWORD_MIN_LENGTH} characters`),
    confirm: z.string().min(1, "Confirm your Notes password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Notes passwords do not match",
    path: ["confirm"],
  });

async function assertNotLoginPassword(email: string | undefined, password: string) {
  if (!isSupabaseConfigured() || !email) return;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    throw new Error("SAME_AS_LOGIN");
  }
}

function unlockedResponse(userId: string) {
  const token = createNotesUnlockToken(userId);
  const response = jsonOk({
    unlocked: true,
    configured: true,
    ttlSeconds: NOTES_UNLOCK_TTL_SECONDS,
  });
  response.cookies.set(NOTES_UNLOCK_COOKIE, token, notesUnlockCookieOptions());
  return response;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    const [unlocked, configured] = await Promise.all([
      isNotesUnlocked(user.id),
      isNotesPasswordConfigured(user.id),
    ]);
    return jsonOk({ unlocked, configured, ttlSeconds: NOTES_UNLOCK_TTL_SECONDS });
  } catch (error) {
    return handleRouteError(error, "[notes/unlock/get]");
  }
}

/** Unlock with existing Notes password, or create it on first use. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const configured = await isNotesPasswordConfigured(user.id);

    if (!configured) {
      const parsed = setupSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.issues[0]?.message ?? "Invalid Notes password data", 400);
      }

      try {
        await assertNotLoginPassword(user.email, parsed.data.password);
      } catch (error) {
        if (error instanceof Error && error.message === "SAME_AS_LOGIN") {
          return jsonError("Notes password must be different from your login password.", 400);
        }
        throw error;
      }

      await setNotesPasswordHash(user.id, parsed.data.password);
      return unlockedResponse(user.id);
    }

    const parsed = unlockSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid unlock data", 400);
    }

    const hash = await getNotesPasswordHash(user.id);
    if (!verifyNotesPassword(parsed.data.password, hash)) {
      return jsonError("Incorrect Notes password.", 401, "INVALID_PASSWORD");
    }

    return unlockedResponse(user.id);
  } catch (error) {
    return handleRouteError(error, "[notes/unlock/post]");
  }
}

/** Change Notes password (requires current Notes password). */
export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const parsed = changeSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid Notes password data", 400);
    }

    const hash = await getNotesPasswordHash(user.id);
    if (!hash) {
      return jsonError("Notes password is not set yet.", 400);
    }

    if (!verifyNotesPassword(parsed.data.currentPassword, hash)) {
      return jsonError("Incorrect current Notes password.", 401, "INVALID_PASSWORD");
    }

    try {
      await assertNotLoginPassword(user.email, parsed.data.password);
    } catch (error) {
      if (error instanceof Error && error.message === "SAME_AS_LOGIN") {
        return jsonError("Notes password must be different from your login password.", 400);
      }
      throw error;
    }

    await setNotesPasswordHash(user.id, parsed.data.password);
    return unlockedResponse(user.id);
  } catch (error) {
    return handleRouteError(error, "[notes/unlock/patch]");
  }
}

export async function DELETE() {
  try {
    await getSessionUser();
    const response = jsonOk({ unlocked: false });
    response.cookies.set(NOTES_UNLOCK_COOKIE, "", notesUnlockCookieOptions(0));
    return response;
  } catch (error) {
    return handleRouteError(error, "[notes/unlock/delete]");
  }
}
