"use client";

import {
  Bell,
  Bookmark,
  BookOpen,
  Brain,
  Clock3,
  LayoutDashboard,
  ListMusic,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export const MOBILE_FOOTER_OFFSET = "3.25rem";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const platformOverflowItems: NavItem[] = [
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/learning", label: "Learning", icon: BookOpen },
  { href: "/career", label: "Career", icon: Brain },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/ai", label: "AI brief", icon: Sparkles },
];

const musicOverflowItems: NavItem[] = [
  { href: "/music/playlists", label: "Playlists", icon: ListMusic },
  { href: "/music/history", label: "History", icon: Clock3 },
  { href: "/dashboard", label: "Personal OS", icon: LayoutDashboard },
];

function matchActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/tasks") return pathname === "/tasks" || pathname.startsWith("/tasks/");
  if (href === "/notes") return pathname === "/notes" || pathname.startsWith("/notes/");
  if (href === "/reminders") {
    return pathname === "/reminders" || pathname.startsWith("/reminders/");
  }
  if (href === "/bookmarks") {
    return pathname === "/bookmarks" || pathname.startsWith("/bookmarks/");
  }
  if (href === "/learning") return pathname === "/learning" || pathname.startsWith("/learning/");
  if (href === "/career") return pathname === "/career" || pathname.startsWith("/career/");
  if (href === "/finance") return pathname === "/finance" || pathname.startsWith("/finance/");
  if (href === "/music") return pathname === "/music" || pathname.startsWith("/music/");
  if (href === "/ai") return pathname === "/ai" || pathname.startsWith("/ai/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface MobileNavMenuProps {
  variant: "platform" | "music";
  trigger?: "menu" | "profile" | "footer";
}

export function MobileNavMenu({ variant, trigger = "profile" }: MobileNavMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const overflowItems = variant === "platform" ? platformOverflowItems : musicOverflowItems;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.replace("/login");
    router.refresh();
  }

  function NavRow({ item }: { item: NavItem }) {
    const active = matchActive(pathname, item.href);
    return (
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-accent",
        )}
      >
        <item.icon className="size-4 shrink-0" />
        {item.label}
      </Link>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger === "footer" ? (
          <button
            type="button"
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            aria-label="More menu"
          >
            <Menu className="size-5 shrink-0" />
            <span>More</span>
          </button>
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label="Open menu">
            {trigger === "profile" ? <User className="size-4" /> : <Menu className="size-4" />}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100vw-2rem,20rem)] gap-0 p-0">
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            <NavRow item={{ href: "/profile", label: "Profile", icon: User }} />
            <NavRow
              item={{
                href: variant === "music" ? "/settings/notifications" : "/settings",
                label: "Settings",
                icon: Settings,
              }}
            />
          </div>

          <div className="my-4 border-t" />

          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {variant === "platform" ? "More services" : "More"}
          </p>
          <div className="space-y-1">
            {overflowItems.map((item) => (
              <NavRow key={item.href} item={item} />
            ))}
          </div>

          <div className="my-4 border-t" />

          <div className="flex items-center justify-between rounded-xl px-3 py-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>

          <Button
            variant="ghost"
            className="mt-2 justify-start gap-3 px-3 text-muted-foreground"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
