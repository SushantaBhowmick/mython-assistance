"use client";

import {
  Bell,
  Bookmark,
  BookOpen,
  Brain,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Music2,
  Plus,
  Sparkles,
  StickyNote,
  User,
  Wallet,
  Webhook,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { describeCommand, parseCommand } from "@/lib/command/parse-command";
import { executeCommand } from "@/lib/command/execute-command";
import { PERSONAL_SERVICES } from "@/lib/services/registry";
import { createClient } from "@/lib/supabase/client";

const QUICK_EXAMPLES = [
  "task Review pull requests",
  "note Docker networking",
  "remind Call mom tomorrow 9am",
  "bookmark https://nextjs.org/docs",
  "learn Next.js App Router",
  "apply Google at Software Engineer",
  "expense lunch 250",
  "brief",
  "play acoustic playlist",
  "go dashboard",
];

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/learning", label: "Learning", icon: BookOpen },
  { href: "/career", label: "Career", icon: Brain },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/ai", label: "AI brief", icon: Sparkles },
  { href: "/settings/automation", label: "Automation", icon: Webhook },
  { href: "/music", label: "Music", icon: Music2 },
  { href: "/music/search", label: "Search music", icon: Music2 },
  { href: "/profile", label: "Profile", icon: User },
];

interface GlobalCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalCommandPalette({ open, onOpenChange }: GlobalCommandPaletteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [searchHits, setSearchHits] = useState<
    Array<{ type: string; id: string; title: string; href: string; meta?: string }>
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const parsed = parseCommand(query);
  const parsedLabel = describeCommand(parsed);
  const showParsedAction = query.trim().length > 0 && parsed.type !== "unknown";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSearchHits([]);
    }
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2 || showParsedAction) {
      setSearchHits([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setSearchHits(data.results ?? []);
        }
      } catch {
        setSearchHits([]);
      } finally {
        setSearchLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query, showParsedAction]);

  async function runCommand(command = parsed) {
    if (running) return;

    setRunning(true);
    let resolved = command;
    if (command.type === "unknown" && command.raw.trim().length > 2) {
      try {
        const res = await fetch("/api/ai/parse-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: command.raw }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.command?.type && data.command.type !== "unknown") {
            resolved = data.command;
          }
        }
      } catch {
        // Fall back to rule-based result
      }
    }

    const result = await executeCommand(resolved);
    setRunning(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    onOpenChange(false);
    router.push(result.href);
    router.refresh();
  }

  async function handleLogout() {
    onOpenChange(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (pathname === "/login" || pathname === "/offline") {
    return null;
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      value={query}
      onValueChange={setQuery}
      title="Command"
      description="Navigate, create tasks, notes, reminders, or search music"
      className="sm:max-w-lg"
    >
      <CommandInput
        placeholder="task …, note …, bookmark https://…, play …, go dashboard"
        onKeyDown={(event) => {
          if (event.key === "Enter" && showParsedAction) {
            event.preventDefault();
            void runCommand();
          }
        }}
      />
      <CommandList>
        <CommandEmpty>No results. Press Enter to run if a command is detected.</CommandEmpty>

        {searchHits.length > 0 && (
          <CommandGroup heading={searchLoading ? "Searching…" : "Search"}>
            {searchHits.map((hit) => (
              <CommandItem
                key={`${hit.type}-${hit.id}`}
                value={`search ${hit.title} ${hit.type}`}
                onSelect={() => {
                  onOpenChange(false);
                  router.push(hit.href);
                }}
                className="cursor-pointer"
              >
                <span className="truncate">{hit.title}</span>
                <CommandShortcut className="capitalize">{hit.type}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {showParsedAction && (
          <CommandGroup heading="Run command">
            <CommandItem
              value={`run ${query}`}
              onSelect={() => {
                void runCommand();
              }}
              disabled={running}
              className="cursor-pointer"
            >
              <Plus className="size-4 text-primary" />
              <span>{parsedLabel}</span>
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              value={`nav ${item.label} ${item.href}`}
              onSelect={() => {
                onOpenChange(false);
                router.push(item.href);
              }}
              className="cursor-pointer"
            >
              <item.icon className="size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Services">
          {PERSONAL_SERVICES.filter((s) => s.status === "active" && s.id !== "dashboard").map(
            (service) => (
              <CommandItem
                key={service.id}
                value={`service ${service.name} ${service.href}`}
                onSelect={() => {
                  onOpenChange(false);
                  router.push(service.href);
                }}
                className="cursor-pointer"
              >
                <service.icon className="size-4" />
                {service.name}
              </CommandItem>
            ),
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Examples">
          {QUICK_EXAMPLES.map((example) => (
            <CommandItem
              key={example}
              value={example}
              onSelect={() => {
                void runCommand(parseCommand(example));
              }}
              className="cursor-pointer"
            >
              {example}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem
            value="logout account"
            onSelect={() => void handleLogout()}
            className="cursor-pointer"
          >
            <LogOut className="size-4" />
            Log out
          </CommandItem>
        </CommandGroup>
        </CommandList>

      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
        <span className="hidden sm:inline">Ctrl+K</span>
        <span className="sm:hidden">⌘K</span>
        {" · "}task · note · remind · bookmark · play · go
      </div>
    </CommandDialog>
  );
}
