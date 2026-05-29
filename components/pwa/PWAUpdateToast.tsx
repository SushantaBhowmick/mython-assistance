"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  activateWaitingServiceWorker,
  isProductionPwaEnabled,
  registerAppServiceWorker,
  waitForServiceWorkerUpdate,
} from "@/lib/pwa";
import { usePlayerStore } from "@/store/player-store";

export function PWAUpdateToast() {
  const [updateReady, setUpdateReady] = useState(false);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!isProductionPwaEnabled()) return;

    registerAppServiceWorker().then((registration) => {
      if (!registration) return;
      waitForServiceWorkerUpdate(registration, () => setUpdateReady(true));
    });
  }, []);

  useEffect(() => {
    if (!isProductionPwaEnabled() || !updateReady || toastShownRef.current) return;

    toastShownRef.current = true;

    toast("New version available", {
      id: "pwa-update",
      description: isPlaying
        ? "An update is ready. Reload when your music is paused."
        : "Reload to get the latest Mython build.",
      duration: Infinity,
      action: {
        label: "Reload",
        onClick: () => {
          if (usePlayerStore.getState().isPlaying) {
            toast.message("Pause playback first, then reload to update.");
            return;
          }
          navigator.serviceWorker.getRegistration().then((registration) => {
            if (registration) {
              activateWaitingServiceWorker(registration);
              window.setTimeout(() => window.location.reload(), 100);
            } else {
              window.location.reload();
            }
          });
        },
      },
    });
  }, [updateReady, isPlaying]);

  useEffect(() => {
    if (!isProductionPwaEnabled()) return;

    function onControllerChange() {
      if (usePlayerStore.getState().isPlaying) return;
      window.setTimeout(() => window.location.reload(), 100);
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return null;
}
