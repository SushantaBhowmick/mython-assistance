import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const clientEntry = path.join(root, "..", "node_modules", ".prisma", "client", "index.js");

try {
  execSync("npx prisma generate", {
    cwd: path.join(root, ".."),
    stdio: "inherit",
  });
} catch (error) {
  if (existsSync(clientEntry)) {
    console.warn(
      "[build] prisma generate skipped: query engine is locked (stop `npm run dev` and retry for a clean generate). Using existing Prisma client.",
    );
    process.exit(0);
  }

  console.error("[build] prisma generate failed and no Prisma client was found.");
  throw error;
}
