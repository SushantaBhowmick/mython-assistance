"use client";

import { Share } from "lucide-react";
import { useEffect, useState } from "react";

import { isIosSafari, isStandaloneDisplayMode } from "@/lib/pwa";

export function IOSInstallInstructions() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isIosSafari() && !isStandaloneDisplayMode());
  }, []);

  if (!show) return null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-medium">Install on iPhone / iPad</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        iOS installs PWAs from Safari only. Open this app in Safari, tap{" "}
        <Share className="inline size-4 align-text-bottom" /> Share, then choose{" "}
        <strong>Add to Home Screen</strong>.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Use Safari (not Chrome on iOS)</li>
        <li>Confirm the app icon and name</li>
        <li>Launch from your home screen for standalone mode</li>
      </ul>
    </div>
  );
}
