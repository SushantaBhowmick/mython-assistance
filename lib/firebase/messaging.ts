"use client";

import { getMessaging, getToken, isSupported, type Messaging } from "firebase/messaging";

import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase/client";

let messagingInstance: Messaging | null = null;

export async function isMessagingSupported() {
  if (typeof window === "undefined") return false;
  if (!isFirebaseConfigured()) return false;
  return isSupported();
}

export async function getFirebaseMessaging() {
  if (!(await isMessagingSupported())) return null;

  const app = getFirebaseApp();
  if (!app) return null;

  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }

  return messagingInstance;
}

export async function registerFirebaseMessagingServiceWorker() {
  if (process.env.NODE_ENV === "development") return null;
  if (!("serviceWorker" in navigator)) return null;

  try {
    return await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/firebase-cloud-messaging-push-scope",
    });
  } catch (error) {
    console.error("[firebase] messaging SW registration failed", error);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported" as const;
  }

  if (Notification.permission === "granted") return "granted" as const;
  if (Notification.permission === "denied") return "denied" as const;

  const result = await Notification.requestPermission();
  return result;
}

export async function getFcmToken() {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const permission = await requestNotificationPermission();
  if (permission !== "granted") return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("[firebase] NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing");
    return null;
  }

  const swRegistration = await registerFirebaseMessagingServiceWorker();

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: swRegistration ?? undefined,
  });
}
