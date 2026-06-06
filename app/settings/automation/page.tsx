"use client";

import { Copy, Webhook } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AutomationEventRow {
  id: string;
  event: string;
  status: string;
  createdAt: string;
}

export default function AutomationSettingsPage() {
  const [events, setEvents] = useState<AutomationEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);

    fetch("/api/automation/events")
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((data) => setEvents(data.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const webhookUrl = `${appUrl}/api/automation/webhook`;

  function copy(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-background/80">
            <Webhook className="size-6 text-primary" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Automation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect n8n or any HTTP client to create tasks, notes, reminders, and transactions.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-3 rounded-2xl border bg-card/50 p-5">
        <h2 className="text-sm font-medium">Webhook URL</h2>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 break-all rounded-lg bg-muted px-3 py-2 text-xs">{webhookUrl}</code>
          <Button type="button" size="sm" variant="outline" onClick={() => copy(webhookUrl, "URL")}>
            <Copy className="size-4" />
            Copy
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Send <code>POST</code> with header{" "}
          <code>Authorization: Bearer YOUR_AUTOMATION_SECRET</code>
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card/50 p-5">
        <h2 className="text-sm font-medium">Supported events</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <code>task.create</code> — {"{ title, description?, priority? }"}
          </li>
          <li>
            <code>note.create</code> — {"{ title, body? }"}
          </li>
          <li>
            <code>reminder.create</code> — {"{ title, remindAt (ISO) }"}
          </li>
          <li>
            <code>transaction.create</code> — {"{ type: EXPENSE|INCOME, amount, description? }"}
          </li>
        </ul>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{`{
  "event": "task.create",
  "payload": { "title": "Review PR" }
}`}</pre>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card/50 p-5">
        <h2 className="text-sm font-medium">Recent events</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No webhook events yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <span>
                  <span className="font-medium">{event.event}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{event.status}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
