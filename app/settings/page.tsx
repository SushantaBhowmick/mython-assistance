import Link from "next/link";
import { Bell, ChevronRight, Plug, Webhook } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Notifications, integrations, and device preferences.
        </p>
      </div>

      <Link
        href="/settings/notifications"
        className="flex items-center justify-between rounded-2xl border bg-card/50 px-5 py-4 transition-colors hover:bg-card/80"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border bg-background/80">
            <Bell className="size-5 text-primary" />
          </span>
          <span>
            <span className="font-medium">Notifications & install</span>
            <p className="text-sm text-muted-foreground">Push alerts and PWA install</p>
          </span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>

      <Link
        href="/settings/integrations"
        className="flex items-center justify-between rounded-2xl border bg-card/50 px-5 py-4 transition-colors hover:bg-card/80"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border bg-background/80">
            <Plug className="size-5 text-primary" />
          </span>
          <span>
            <span className="font-medium">Integrations</span>
            <p className="text-sm text-muted-foreground">
              Google Calendar sync for tasks
            </p>
          </span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>

      <Link
        href="/settings/automation"
        className="flex items-center justify-between rounded-2xl border bg-card/50 px-5 py-4 transition-colors hover:bg-card/80"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border bg-background/80">
            <Webhook className="size-5 text-primary" />
          </span>
          <span>
            <span className="font-medium">Automation</span>
            <p className="text-sm text-muted-foreground">Webhooks for n8n and workflows</p>
          </span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>
    </div>
  );
}
