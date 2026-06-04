"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BeforeInstallPromptEvent } from "@/lib/pwa";
import {
  dismissInstallBanner,
  isInstallPromptSupported,
  isStandaloneDisplayMode,
  wasInstallBannerDismissed,
} from "@/lib/pwa";

export function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandaloneDisplayMode() || wasInstallBannerDismissed()) return;

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function onInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || isStandaloneDisplayMode()) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setVisible(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    dismissInstallBanner();
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[60] border-b bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-top">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <Download className="size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Install app</p>
          <p className="text-xs text-muted-foreground">
            Add to your home screen for a native-like music experience.
          </p>
        </div>
        <Button size="sm" onClick={handleInstall} disabled={!deferredPrompt}>
          Install
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={handleDismiss} aria-label="Dismiss">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function ManualInstallHint() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(!isInstallPromptSupported() && !isStandaloneDisplayMode());
  }, []);

  if (!showHint) return null;

  return (
    <p className="text-sm text-muted-foreground">
      To install, use your browser menu and choose &quot;Install app&quot; or
      &quot;Add to Home Screen&quot;.
    </p>
  );
}
