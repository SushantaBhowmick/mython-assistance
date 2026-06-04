"use client";

import { Bookmark, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function BookmarksLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Bookmarks service
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Bookmarks</h1>
        <p className="text-sm text-muted-foreground">
          Save links for later — articles, docs, and references.
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
          href="/bookmarks"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm",
            pathname.startsWith("/bookmarks")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          <Bookmark className="size-4" />
          All bookmarks
        </Link>
      </nav>

      {children}
    </div>
  );
}
