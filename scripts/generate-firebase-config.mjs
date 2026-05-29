import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    const env = {};

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }

    return env;
  } catch {
    return {};
  }
}

const env = {
  ...loadEnvFile(path.join(process.cwd(), ".env")),
  ...process.env,
};

const config = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

const output = `self.FIREBASE_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
writeFileSync(path.join(process.cwd(), "public", "firebase-messaging-config.js"), output);
console.log("Generated public/firebase-messaging-config.js");
