"use client";

import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { InstallPWAButton } from "@/components/pwa/InstallPWAButton";
import { IOSInstallInstructions } from "@/components/pwa/IOSInstallInstructions";
import { ManualInstallHint } from "@/components/pwa/PWAInstallBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getFcmToken,
  isMessagingSupported,
  requestNotificationPermission,
} from "@/lib/firebase/messaging";
import { isFirebaseConfigured } from "@/lib/firebase/client";

interface RegisteredToken {
  id: string;
  platform: string | null;
  updatedAt: string;
}

export default function NotificationSettingsPage() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [supported, setSupported] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<RegisteredToken[]>([]);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  useEffect(() => {
    setFirebaseReady(isFirebaseConfigured());

    async function init() {
      const messagingSupported = await isMessagingSupported();
      setSupported(messagingSupported);

      if (typeof window !== "undefined" && "Notification" in window) {
        setPermission(Notification.permission);
      } else {
        setPermission("unsupported");
      }

      try {
        const response = await fetch("/api/notifications/register");
        if (response.ok) {
          const data = await response.json();
          setTokens(data.tokens ?? []);
        }
      } catch {
        // Optional until backend is ready.
      }
    }

    init();
  }, []);

  async function enableNotifications() {
    setLoading(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result === "unsupported" ? "unsupported" : result);

      if (result !== "granted") {
        toast.error("Notification permission was not granted");
        return;
      }

      const token = await getFcmToken();
      if (!token) {
        toast.error("Could not generate FCM token");
        return;
      }

      const response = await fetch("/api/notifications/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save token");
      }

      toast.success("Notifications enabled");
      setCurrentToken(token);
      const refreshed = await fetch("/api/notifications/register");
      const data = await refreshed.json();
      setTokens(data.tokens ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  }

  async function sendTestNotification() {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Test failed");
      toast.success("Test notification sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send test notification");
    } finally {
      setLoading(false);
    }
  }

  async function disableNotifications() {
    setLoading(true);
    try {
      if (currentToken) {
        await fetch("/api/notifications/register", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: currentToken }),
        });
      }
      setCurrentToken(null);
      setTokens([]);
      toast.success("Device registration cleared");
    } catch {
      toast.error("Failed to disable notifications");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Enable Firebase push notifications for reminders and alerts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Push notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm">
            <p>
              Firebase configured:{" "}
              <strong>{firebaseReady ? "Yes" : "No"}</strong>
            </p>
            <p>
              Browser support: <strong>{supported ? "Yes" : "No"}</strong>
            </p>
            <p>
              Permission: <strong>{permission}</strong>
            </p>
            <p>
              Registered devices: <strong>{tokens.length}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={enableNotifications} disabled={loading || !firebaseReady || !supported}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
              Enable notifications
            </Button>
            <Button
              variant="secondary"
              onClick={sendTestNotification}
              disabled={loading || tokens.length === 0}
            >
              <Send className="size-4" />
              Send test
            </Button>
            <Button variant="outline" onClick={disableNotifications} disabled={loading}>
              <BellOff className="size-4" />
              Clear registration
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Install app</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InstallPWAButton />
          <ManualInstallHint />
          <IOSInstallInstructions />
        </CardContent>
      </Card>
    </div>
  );
}
