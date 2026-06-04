"use client";

import { LayoutDashboard, Plus, StickyNote } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "OS", icon: LayoutDashboard },
  { href: "/notes", label: "All notes", icon: StickyNote },
];

export function NotesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/notes") {
      return pathname === "/notes" || pathname === "/notes/new";
    }
    return pathname === href;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Notes service
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground">
            Markdown knowledge base — private to you.
          </p>
        </div>
        <Button asChild>
          <Link href="/notes/new">
            <Plus className="size-4" />
            New note
          </Link>
        </Button>
      </div>

      <nav className="flex gap-2 border-b pb-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
