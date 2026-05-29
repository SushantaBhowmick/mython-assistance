const PWA_INSTALL_DISMISSED_KEY = "mython-pwa-install-dismissed";
const PWA_INSTALL_DISMISSED_AT_KEY = "mython-pwa-install-dismissed-at";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

export function isInstallPromptSupported() {
  return typeof window !== "undefined" && "BeforeInstallPromptEvent" in window;
}

export function wasInstallBannerDismissed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === "true";
}

export function dismissInstallBanner() {
  if (typeof window === "undefined") return;
  localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "true");
  localStorage.setItem(PWA_INSTALL_DISMISSED_AT_KEY, String(Date.now()));
}

export function clearInstallBannerDismissal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
  localStorage.removeItem(PWA_INSTALL_DISMISSED_AT_KEY);
}

export async function registerAppServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  if (!isProductionPwaEnabled()) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (error) {
    console.error("[pwa] Service worker registration failed", error);
    return null;
  }
}

export function waitForServiceWorkerUpdate(
  registration: ServiceWorkerRegistration,
  onUpdate: () => void,
) {
  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    if (!installing) return;

    installing.addEventListener("statechange", () => {
      if (
        installing.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        onUpdate();
      }
    });
  });
}

export function activateWaitingServiceWorker(
  registration: ServiceWorkerRegistration,
) {
  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
}

export function isOnline() {
  if (typeof window === "undefined") return true;
  return window.navigator.onLine;
}

export function isProductionPwaEnabled() {
  return process.env.NODE_ENV === "production";
}

/** Remove stale SW registrations left over from `npm start` / production testing. */
export async function unregisterDevServiceWorkers() {
  if (isProductionPwaEnabled()) return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch (error) {
    console.warn("[pwa] Failed to unregister dev service workers", error);
  }
}
