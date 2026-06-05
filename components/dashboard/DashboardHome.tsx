"use client";

import {
  Bell,
  Bookmark,
  BookOpen,
  Brain,
  ListTodo,
  Music2,
  Plus,
  StickyNote,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ContinueMusicWidget } from "@/components/dashboard/ContinueMusicWidget";
import { DashboardFocus } from "@/components/dashboard/DashboardFocus";
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

  function reload() {
    fetch("/api/dashboard/summary", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  const serviceIds = PERSONAL_SERVICES.filter((s) => s.id !== "dashboard").map(
    (s) => s.id,
  );

  const recentNotes = summary
    ? [...summary.notesPinned, ...summary.notesRecent.filter(
        (n) => !summary.notesPinned.some((p) => p.id === n.id),
      )].slice(0, 3)
    : [];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur-md sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {loading ? (
              <Skeleton className="h-9 w-48" />
            ) : (
              <h1 className="text-3xl font-semibold tracking-tight">
                {summary?.greeting ?? "Hello"}
              </h1>
            )}
            {!loading && summary && (
              <DashboardFocus
                initialFocus={summary.focus}
                onUpdated={(focus) => setSummary((s) => (s ? { ...s, focus } : s))}
              />
            )}
          </div>
          <CommandPaletteTrigger />
        </div>

        {!loading && (
          <div className="relative mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/tasks/new">
                <Plus className="size-4" />
                Task
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/notes/new">
                <Plus className="size-4" />
                Note
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/bookmarks">
                <Bookmark className="size-4" />
                Bookmark
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/music">
                <Music2 className="size-4" />
                Music
              </Link>
            </Button>
          </div>
        )}
      </section>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
            label="Alerts"
            value={summary.counts.remindersUpcoming}
            href="/reminders"
            icon={Bell}
            accent="from-violet-500/20 to-fuchsia-500/10"
          />
          <StatCard
            label="Courses"
            value={summary.counts.learningActive}
            href="/learning"
            icon={BookOpen}
            accent="from-indigo-500/20 to-violet-500/10"
          />
          <StatCard
            label="Applications"
            value={summary.counts.applicationsActive}
            href="/career"
            icon={Brain}
            accent="from-cyan-500/20 to-sky-500/10"
          />
        </div>
      ) : null}

      {!loading && summary?.musicContinue && (
        <section className="space-y-3 rounded-2xl border bg-card/50 p-5 backdrop-blur-sm">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Continue listening
          </h2>
          <ContinueMusicWidget track={summary.musicContinue} />
        </section>
      )}

      {!loading && summary && recentNotes.length > 0 && (
        <section className="space-y-4 rounded-2xl border bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Recent notes
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/notes">View all</Link>
            </Button>
          </div>
          <ul className="space-y-2">
            {recentNotes.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/notes/${note.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-background/60 px-3 py-2 text-sm transition-colors hover:bg-accent/50"
                >
                  <span className="truncate font-medium">{note.title}</span>
                  {note.pinned ? (
                    <span className="shrink-0 text-xs text-primary">Pinned</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {!loading && summary && (
        <Link
          href="/finance"
          className="flex items-center justify-between rounded-2xl border bg-card/40 px-5 py-4 text-sm transition-colors hover:bg-card/60"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="size-4" />
            Finance — track expenses & income
          </span>
          <ArrowRight className="size-4 text-primary" />
        </Link>
      )}
    </div>
  );
}
