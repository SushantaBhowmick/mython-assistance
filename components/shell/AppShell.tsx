"use client";

import {
  Bell,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Music2,
  Settings,
  StickyNote,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const desktopNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/music", label: "Music", icon: Music2 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/reminders", label: "Alerts", icon: Bell },
  { href: "/music", label: "Music", icon: Music2 },
];

function matchActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/tasks") return pathname === "/tasks" || pathname.startsWith("/tasks/");
  if (href === "/notes") return pathname === "/notes" || pathname.startsWith("/notes/");
  if (href === "/reminders") {
    return pathname === "/reminders" || pathname.startsWith("/reminders/");
  }
  if (href === "/music") return pathname === "/music" || pathname.startsWith("/music/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6 safe-top">
        <aside className="hidden md:block md:w-56 md:shrink-0">
          <div className="sticky top-6 space-y-6">
            <div>
              <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
                Mython
              </Link>
              <p className="text-sm text-muted-foreground">Personal OS</p>
            </div>

            <nav className="flex flex-col gap-1">
              {desktopNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    matchActive(pathname, item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
              <Button
                variant="ghost"
                className="justify-start gap-2 px-3 text-muted-foreground"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Log out
              </Button>
            </nav>

            <ThemeToggle />
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <Link href="/dashboard" className="text-sm font-semibold">
              Mython
            </Link>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon-sm">
                <Link href="/profile" aria-label="Profile">
                  <User className="size-4" />
                </Link>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon-sm" onClick={handleLogout} aria-label="Log out">
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-1 py-1.5 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-around gap-0.5">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px]",
                matchActive(pathname, item.href)
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
