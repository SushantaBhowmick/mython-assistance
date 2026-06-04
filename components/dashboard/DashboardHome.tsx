"use client";

import {
  Bell,
  Bookmark,
  ListTodo,
  StickyNote,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CommandPaletteTrigger } from "@/components/shell/CommandPaletteTrigger";
import { ServiceCard } from "@/components/shell/ServiceCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardSummary } from "@/modules/dashboard/types";
import { PERSONAL_SERVICES } from "@/lib/services/registry";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  href,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  icon: typeof ListTodo;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/60 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-80",
          accent,
        )}
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
        </div>
        <Icon className="size-8 text-primary/80" />
      </div>
    </Link>
  );
}

export function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const serviceIds = PERSONAL_SERVICES.filter((s) => s.id !== "dashboard").map(
    (s) => s.id,
  );

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur-md sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            {loading ? (
              <Skeleton className="h-9 w-48" />
            ) : (
              <h1 className="text-3xl font-semibold tracking-tight">
                {summary?.greeting ?? "Hello"}
              </h1>
            )}
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Your command center — tasks, notes, reminders, and music in one place.
            </p>
          </div>
          <CommandPaletteTrigger />
        </div>
      </section>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Due today"
            value={summary.counts.tasksToday}
            href="/tasks?filter=today"
            icon={ListTodo}
            accent="from-sky-500/20 to-blue-500/10"
          />
          <StatCard
            label="Overdue"
            value={summary.counts.tasksOverdue}
            href="/tasks?filter=overdue"
            icon={AlertTriangle}
            accent="from-rose-500/20 to-orange-500/10"
          />
          <StatCard
            label="Notes"
            value={summary.counts.notes}
            href="/notes"
            icon={StickyNote}
            accent="from-amber-500/20 to-orange-500/10"
          />
          <StatCard
            label="Upcoming alerts"
            value={summary.counts.remindersUpcoming}
            href="/reminders"
            icon={Bell}
            accent="from-violet-500/20 to-fuchsia-500/10"
          />
        </div>
      ) : null}

      {!loading && summary && (summary.tasksToday.length > 0 || summary.tasksOverdue.length > 0) && (
        <section className="space-y-4 rounded-2xl border bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              Today
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/tasks">
                All tasks
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <ul className="space-y-2">
            {[...summary.tasksOverdue, ...summary.tasksToday].slice(0, 6).map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-background/60 px-3 py-2 text-sm transition-colors hover:bg-accent/50"
                >
                  <span className="truncate font-medium">{task.title}</span>
                  {task.overdue ? (
                    <span className="shrink-0 text-xs text-destructive">Overdue</span>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">Today</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading && summary && summary.remindersNext.length > 0 && (
        <section className="space-y-4 rounded-2xl border bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Next reminders
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/reminders">View all</Link>
            </Button>
          </div>
          <ul className="space-y-2">
            {summary.remindersNext.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border bg-background/60 px-3 py-2 text-sm"
              >
                <span className="truncate">{r.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(r.effectiveAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Services
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceIds.map((id) => (
            <ServiceCard key={id} serviceId={id} />
          ))}
        </div>
      </section>

      {!loading && summary && summary.counts.bookmarks > 0 && (
        <Link
          href="/bookmarks"
          className="flex items-center justify-between rounded-2xl border border-dashed bg-muted/20 px-5 py-4 text-sm transition-colors hover:bg-muted/30"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <Bookmark className="size-4" />
            {summary.counts.bookmarks} saved links
          </span>
          <ArrowRight className="size-4 text-primary" />
        </Link>
      )}
    </div>
  );
}
