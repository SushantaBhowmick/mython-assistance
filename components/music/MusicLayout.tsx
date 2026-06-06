"use client";

import {
  Clock3,
  Heart,
  Home,
  ListMusic,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/shell/BrandMark";
import {
  MOBILE_FOOTER_OFFSET,
  MobileNavMenu,
} from "@/components/shell/MobileNavMenu";
import { PlatformBackdrop } from "@/components/shell/PlatformBackdrop";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/player-store";

const desktopNavItems = [
  { href: "/music", label: "Home", icon: Home },
  { href: "/music/search", label: "Search", icon: Search },
  { href: "/music/favorites", label: "Favorites", icon: Heart },
  { href: "/music/playlists", label: "Playlists", icon: ListMusic },
  { href: "/music/history", label: "History", icon: Clock3 },
];

const mobilePrimaryNav = desktopNavItems;

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
          ? "min-w-0 flex-1 flex-col gap-0.5 rounded-lg px-2 py-1 text-[11px]"
          : "gap-2 rounded-lg px-3 py-2 text-sm",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className={cn("shrink-0", mobile ? "size-5" : "size-4")} />
      <span className={cn(mobile && "truncate")}>{label}</span>
    </Link>
  );
}

export function MusicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  function isActive(href: string) {
    if (href === "/music") {
      return pathname === "/music";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-background md:pb-36",
        currentTrack
          ? "pb-[calc(var(--mobile-footer)+4.5rem+env(safe-area-inset-bottom))] md:pb-36"
          : "pb-[calc(var(--mobile-footer)+env(safe-area-inset-bottom))] md:pb-36",
      )}
      style={{ ["--mobile-footer" as string]: MOBILE_FOOTER_OFFSET }}
    >
      <PlatformBackdrop />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6 safe-top">
        <aside className="hidden md:block md:w-56 md:shrink-0">
          <div className="sticky top-6 space-y-5 rounded-2xl border bg-card/40 p-4 shadow-sm backdrop-blur-md">
            <div className="flex flex-col items-center gap-2 text-center">
              <BrandMark size="md" href="/music" />
              <p className="text-xs text-muted-foreground">Music</p>
            </div>

            <nav className="flex flex-col gap-1">
              {desktopNavItems.map((item) => (
                <NavLink key={item.href} {...item} active={isActive(item.href)} />
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <BrandMark size="sm" href="/music" />
            <div className="flex items-center gap-1">
              <MobileNavMenu variant="music" trigger="profile" />
            </div>
          </div>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 py-1.5 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-around">
          {mobilePrimaryNav.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} mobile />
          ))}
          <MobileNavMenu variant="music" trigger="footer" />
        </div>
      </nav>
    </div>
  );
}
