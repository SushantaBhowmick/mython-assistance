"use client";

import { LayoutDashboard, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface ModuleNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
}

interface ModuleNavProps {
  items: ModuleNavItem[];
}

export function ModuleNav({ items }: ModuleNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 rounded-xl border bg-card/40 p-1.5 backdrop-blur-sm">
      <Link
        href="/dashboard"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
          pathname === "/dashboard"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <LayoutDashboard className="size-4" />
        Home
      </Link>
      {items.map((item) => {
        const active = item.match
          ? item.match(pathname)
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
