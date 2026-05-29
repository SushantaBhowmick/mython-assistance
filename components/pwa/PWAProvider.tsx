"use client";

import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";
import { PWAUpdateToast } from "@/components/pwa/PWAUpdateToast";
import {
  isProductionPwaEnabled,
  registerAppServiceWorker,
  unregisterDevServiceWorkers,
} from "@/lib/pwa";
import { useEffect } from "react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (isProductionPwaEnabled()) {
      registerAppServiceWorker();
      return;
    }

    unregisterDevServiceWorkers();
  }, []);

  return (
    <>
      {children}
      <PWAInstallBanner />
      {isProductionPwaEnabled() ? <PWAUpdateToast /> : null}
    </>
  );
}
