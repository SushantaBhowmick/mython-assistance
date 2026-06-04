import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

export function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

export function getFirebaseAdminApp(): App | null {
  if (!isFirebaseAdminConfigured()) return null;

  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: getPrivateKey()!,
    }),
  });
}

export function getFirebaseAdminMessaging(): Messaging | null {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getMessaging(app);
}

export async function sendPushNotification(input: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging) {
    throw new Error("Firebase Admin is not configured");
  }

  return messaging.send({
    token: input.token,
    notification: {
      title: input.title,
      body: input.body,
    },
    data: input.data,
    webpush: {
      fcmOptions: {
        link: input.data?.href ?? "/reminders",
      },
    },
  });
}
