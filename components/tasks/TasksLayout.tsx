"use client";

import { LayoutDashboard, ListTodo, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TasksLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tasks service
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Priorities, due dates, and daily planning.
          </p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="size-4" />
            New task
          </Link>
        </Button>
      </div>

      <nav className="flex gap-2 border-b pb-2">
        <Link
          href="/dashboard"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm",
            pathname === "/dashboard"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          <LayoutDashboard className="size-4" />
          OS
        </Link>
        <Link
          href="/tasks"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm",
            pathname.startsWith("/tasks")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          <ListTodo className="size-4" />
          All tasks
        </Link>
      </nav>

      {children}
    </div>
  );
}
