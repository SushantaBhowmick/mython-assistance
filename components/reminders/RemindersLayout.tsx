"use client";

import { Bell, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function RemindersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Reminders service
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Reminders</h1>
        <p className="text-sm text-muted-foreground">
          Schedule alerts and link them to tasks or notes.
        </p>
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
          href="/reminders"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm",
            pathname.startsWith("/reminders")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          <Bell className="size-4" />
          All reminders
        </Link>
      </nav>

      {children}
    </div>
  );
}
