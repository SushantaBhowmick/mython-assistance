"use client";

import { CalendarDays, Link2Off } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  googleEmail: string | null;
  connectedAt: string | null;
}

export function GoogleCalendarConnect() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/google/status");
      if (!res.ok) throw new Error("Failed to load status");
      const data = (await res.json()) as GoogleStatus;
      setStatus(data);
    } catch {
      setStatus({
        configured: false,
        connected: false,
        googleEmail: null,
        connectedAt: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const result = searchParams.get("google");
    if (!result) return;
    if (result === "connected") {
      toast.success("Google Calendar connected");
      void loadStatus();
    } else if (result === "error") {
      const reason = searchParams.get("reason") ?? "unknown";
      const hints: Record<string, string> = {
        invalid_state: "OAuth state failed — try Connect again",
        invalid_state_format: "OAuth state was malformed — try Connect again",
        no_pending_state: "No pending connect — click Connect again (don’t reuse an old Google tab)",
        state_mismatch: "OAuth state mismatch — click Connect again",
        state_expired: "Connect link expired — click Connect again",
        missing_refresh_token: "Google did not return a refresh token — revoke Mython access in Google Account and retry",
        exchange_failed: "Token exchange failed — check Client ID/Secret and redirect URI",
        missing_code: "Google did not return an auth code",
      };
      toast.error(hints[reason] ?? `Google Calendar connect failed (${reason})`);
    }
  }, [searchParams, loadStatus]);

  async function disconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/google/disconnect", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Disconnect failed");
      toast.success("Google Calendar disconnected");
      await loadStatus();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disconnect",
      );
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  const configured = status?.configured ?? false;
  const connected = status?.connected ?? false;

  return (
    <section className="space-y-4 rounded-2xl border bg-card/50 p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background/80">
          <CalendarDays className="size-5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium">Google Calendar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sync tasks with a due date/time to your Google Calendar (one-way).
          </p>
        </div>
      </div>

      {!configured ? (
        <p className="text-sm text-muted-foreground">
          Not configured. Add{" "}
          <code className="text-xs">GOOGLE_CLIENT_ID</code> and{" "}
          <code className="text-xs">GOOGLE_CLIENT_SECRET</code> to your env, then
          restart the app. See{" "}
          <code className="text-xs">docs/google-calendar-tasks-sync.md</code>.
        </p>
      ) : connected ? (
        <div className="space-y-3">
          <p className="text-sm">
            Connected as{" "}
            <span className="font-medium">{status?.googleEmail}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disconnecting}
            onClick={() => void disconnect()}
          >
            <Link2Off className="size-4" />
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </Button>
        </div>
      ) : (
        <Button type="button" size="sm" asChild>
          <a href="/api/integrations/google/connect">Connect Google Calendar</a>
        </Button>
      )}
    </section>
  );
}
