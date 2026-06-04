/**
 * Seeds the single Mython owner account in Supabase Auth + Prisma profile.
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL
 *   SEED_OWNER_PASSWORD  (min 8 chars — your login password)
 *
 * Usage: node scripts/seed-owner.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const profilePath = path.join(root, "prisma", "seed-data", "owner-profile.json");

const LEGACY_USER_ID = "local-dev-user";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = requireEnv("SEED_OWNER_PASSWORD");

const owner = JSON.parse(readFileSync(profilePath, "utf8"));
const email = owner.email;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

async function findOrCreateAuthUser() {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (listError) throw listError;

  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    console.log(`Auth user exists: ${existing.id}`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { name: owner.name },
    });
    if (updateError) throw updateError;
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: owner.name },
  });

  if (error) throw error;
  console.log(`Created auth user: ${data.user.id}`);
  return data.user.id;
}

async function migrateLegacyUserId(newUserId) {
  const tables = [
    { model: "savedTrack", field: "userId" },
    { model: "playlist", field: "userId" },
    { model: "favorite", field: "userId" },
    { model: "listeningHistory", field: "userId" },
    { model: "trackStats", field: "userId" },
    { model: "notificationToken", field: "userId" },
    { model: "profile", field: "userId" },
  ];

  for (const { model, field } of tables) {
    const result = await prisma[model].updateMany({
      where: { [field]: LEGACY_USER_ID },
      data: { [field]: newUserId },
    });
    if (result.count > 0) {
      console.log(`Migrated ${result.count} row(s) in ${model}`);
    }
  }
}

async function upsertProfile(userId) {
  const dateOfBirth = owner.dateOfBirth ? new Date(owner.dateOfBirth) : null;

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      email: owner.email,
      name: owner.name,
      age: owner.age,
      dateOfBirth,
      phone: owner.phone,
      location: owner.location,
      githubUrl: owner.githubUrl,
      linkedinUrl: owner.linkedinUrl,
      about: owner.about,
      skills: owner.skills,
      career: owner.career,
      experience: owner.experience,
      education: owner.education,
      projects: owner.projects,
    },
    update: {
      email: owner.email,
      name: owner.name,
      age: owner.age,
      dateOfBirth,
      phone: owner.phone,
      location: owner.location,
      githubUrl: owner.githubUrl,
      linkedinUrl: owner.linkedinUrl,
      about: owner.about,
      skills: owner.skills,
      career: owner.career,
      experience: owner.experience,
      education: owner.education,
      projects: owner.projects,
    },
  });

  console.log("Profile upserted for", owner.name);
}

async function main() {
  const userId = await findOrCreateAuthUser();
  await migrateLegacyUserId(userId);
  await upsertProfile(userId);
  console.log("\nSeed complete.");
  console.log(`Login at /login with:\n  Email: ${email}\n  Password: (SEED_OWNER_PASSWORD)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
