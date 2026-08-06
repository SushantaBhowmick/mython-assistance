import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma/client";

export const NOTES_UNLOCK_COOKIE = "mython_notes_unlock";
export const NOTES_UNLOCK_TTL_SECONDS = 30 * 60;
export const NOTES_PASSWORD_MIN_LENGTH = 6;

function getUnlockSecret() {
  return (
    process.env.NOTES_UNLOCK_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "mython-notes-unlock-dev"
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getUnlockSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function hashNotesPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyNotesPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;

  const next = scryptSync(password, salt, 64).toString("base64url");
  return safeEqual(hash, next);
}

export function createNotesUnlockToken(userId: string, ttlSeconds = NOTES_UNLOCK_TTL_SECONDS) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyNotesUnlockToken(token: string | undefined, userId: string) {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [tokenUserId, expiresRaw, signature] = parts;
  if (!tokenUserId || !expiresRaw || !signature) return false;
  if (tokenUserId !== userId) return false;

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 < Date.now()) return false;

  const payload = `${tokenUserId}.${expiresRaw}`;
  const expected = signPayload(payload);
  return safeEqual(signature, expected);
}

export async function getNotesPasswordHash(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { notesPasswordHash: true },
  });
  return profile?.notesPasswordHash ?? null;
}

export async function isNotesPasswordConfigured(userId: string) {
  const hash = await getNotesPasswordHash(userId);
  return Boolean(hash);
}

export async function setNotesPasswordHash(userId: string, password: string) {
  const notesPasswordHash = hashNotesPassword(password);
  await prisma.profile.upsert({
    where: { userId },
    create: { userId, notesPasswordHash },
    update: { notesPasswordHash },
  });
}

export async function isNotesUnlocked(userId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOTES_UNLOCK_COOKIE)?.value;
  return verifyNotesUnlockToken(token, userId);
}

export async function requireNotesUnlocked(userId: string) {
  const unlocked = await isNotesUnlocked(userId);
  if (!unlocked) {
    throw new AppError("Notes are locked. Enter your Notes password to unlock.", 403, "NOTES_LOCKED");
  }
}

export function notesUnlockCookieOptions(maxAge = NOTES_UNLOCK_TTL_SECONDS) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
