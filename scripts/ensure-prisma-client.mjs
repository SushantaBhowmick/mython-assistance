import { execSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientEntry = path.join(projectRoot, "node_modules", ".prisma", "client", "index.js");
const schemaPath = path.join(projectRoot, "prisma", "schema.prisma");

function isCiBuild() {
  return Boolean(process.env.VERCEL || process.env.CI);
}

function clientIsUpToDate() {
  if (!existsSync(clientEntry) || !existsSync(schemaPath)) {
    return false;
  }

  try {
    return statSync(clientEntry).mtimeMs >= statSync(schemaPath).mtimeMs;
  } catch {
    return existsSync(clientEntry);
  }
}

function runGenerate() {
  execSync("npx prisma generate", {
    cwd: projectRoot,
    stdio: "pipe",
    encoding: "utf8",
  });
}

function handleGenerateFailure(error) {
  const output = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
  const isLocked = /EPERM|operation not permitted/i.test(output);

  if (isLocked && existsSync(clientEntry)) {
    console.warn(
      "[build] Prisma engine is locked by a running dev server. Using existing client. Stop `npm run dev` before building for a fresh generate.",
    );
    return;
  }

  if (output) {
    console.error(output);
  }

  console.error("[build] prisma generate failed.");
  process.exit(1);
}

if (isCiBuild()) {
  try {
    runGenerate();
    console.log("[build] Prisma client generated.");
  } catch (error) {
    handleGenerateFailure(error);
  }
  process.exit(0);
}

if (clientIsUpToDate()) {
  console.log("[build] Using existing Prisma client.");
  process.exit(0);
}

try {
  runGenerate();
  console.log("[build] Prisma client generated.");
} catch (error) {
  handleGenerateFailure(error);
}
