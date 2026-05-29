"use client";

import {
  Clock3,
  Heart,
  Home,
  ListMusic,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/player-store";

const navItems = [
  { href: "/music", label: "Home", icon: Home },
  { href: "/music/search", label: "Search", icon: Search },
  { href: "/music/favorites", label: "Favorites", icon: Heart },
  { href: "/music/playlists", label: "Playlists", icon: ListMusic },
  { href: "/music/history", label: "History", icon: Clock3 },
];

const mobileNavItems = navItems;

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  mobile = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center transition-colors",
        mobile
          ? "min-w-0 flex-1 flex-col gap-0.5 rounded-lg px-1 py-1 text-[10px]"
          : "gap-2 rounded-lg px-3 py-2 text-sm",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className={cn("shrink-0", mobile ? "size-4" : "size-4")} />
      <span className={cn(mobile && "truncate max-w-[3.25rem]")}>{label}</span>
    </Link>
  );
}

export function MusicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  function isActive(href: string) {
    return pathname === href || (href !== "/music" && pathname.startsWith(href));
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-background md:pb-36",
        currentTrack
          ? "pb-[calc(11.5rem+env(safe-area-inset-bottom))] md:pb-36"
          : "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-36",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6 safe-top">
        <aside className="hidden md:block md:w-56 md:shrink-0">
          <div className="sticky top-6 space-y-6">
            <div>
              <Link href="/music" className="text-lg font-semibold tracking-tight">
                Mython Music
              </Link>
              <p className="text-sm text-muted-foreground">Your music on Mython</p>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} active={isActive(item.href)} />
              ))}
              <NavLink
                href="/settings/notifications"
                label="Settings"
                icon={Settings}
                active={pathname.startsWith("/settings")}
              />
            </nav>

            <ThemeToggle />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <div>
              <p className="text-sm font-medium">Mython Music</p>
              <p className="text-xs text-muted-foreground">Your music on Mython</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                className={cn(
                  pathname.startsWith("/settings") &&
                    "bg-primary text-primary-foreground",
                )}
              >
                <Link href="/settings/notifications" aria-label="Settings">
                  <Settings className="size-4" />
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-1 py-1.5 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-around gap-0.5">
          {mobileNavItems.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} mobile />
          ))}
        </div>
      </nav>
    </div>
  );
}
