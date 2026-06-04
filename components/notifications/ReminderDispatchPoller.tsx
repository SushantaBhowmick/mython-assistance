"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const POLL_MS = 60_000;

export function ReminderDispatchPoller() {
  const pathname = usePathname();
  const lastRun = useRef(0);

  useEffect(() => {
    if (pathname === "/login" || pathname === "/offline") return;

    async function tick() {
      const now = Date.now();
      if (now - lastRun.current < POLL_MS) return;
      lastRun.current = now;

      try {
        await fetch("/api/reminders/dispatch-due", { method: "POST" });
      } catch {
        // Silent — push is best-effort while app is open
      }
    }

    void tick();
    const id = window.setInterval(tick, POLL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void tick();
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
