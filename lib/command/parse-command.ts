import { addHours } from "date-fns";

import { getActiveServices, type ServiceId } from "@/lib/services/registry";

import { parseRemindTime, stripTimePhrases } from "@/lib/command/parse-remind-time";

export type ParsedCommand =
  | { type: "navigate"; href: string; label: string }
  | { type: "create-task"; title: string }
  | { type: "create-note"; title: string }
  | { type: "create-reminder"; title: string; remindAt: Date }
  | { type: "music-search"; query: string }
  | { type: "create-bookmark"; title: string; url: string }
  | { type: "unknown"; raw: string };

const NAV_ALIASES: Record<string, ServiceId | "profile" | "settings"> = {
  home: "dashboard",
  dashboard: "dashboard",
  os: "dashboard",
  music: "music",
  play: "music",
  notes: "notes",
  note: "notes",
  tasks: "tasks",
  task: "tasks",
  todos: "tasks",
  reminders: "reminders",
  reminder: "reminders",
  alerts: "reminders",
  bookmarks: "bookmarks",
  bookmark: "bookmarks",
  links: "bookmarks",
  saved: "bookmarks",
  profile: "profile",
  settings: "settings",
};

function resolveNavigation(target: string): ParsedCommand | null {
  const key = target.toLowerCase().trim();
  const id = NAV_ALIASES[key];
  if (!id) return null;

  if (id === "profile") {
    return { type: "navigate", href: "/profile", label: "Profile" };
  }
  if (id === "settings") {
    return { type: "navigate", href: "/settings", label: "Settings" };
  }

  const service = getActiveServices().find((s) => s.id === id);
  if (service) {
    return { type: "navigate", href: service.href, label: service.name };
  }

  return null;
}

function bookmarkTitleFromUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return "Saved link";
  }
}

export function parseCommand(raw: string): ParsedCommand {
  const input = raw.trim();
  if (!input) return { type: "unknown", raw: "" };

  const lower = input.toLowerCase();

  if (lower.startsWith("go ") || lower.startsWith("open ")) {
    const target = input.replace(/^(go|open)\s+/i, "").trim();
    const nav = resolveNavigation(target.split(/\s+/)[0] ?? "");
    if (nav) return nav;
  }

  const navOnly = resolveNavigation(input);
  if (navOnly && input.split(/\s+/).length === 1) {
    return navOnly;
  }

  if (/^(task|todo)\s+/i.test(input)) {
    const title = input.replace(/^(task|todo)\s+/i, "").trim();
    if (title) return { type: "create-task", title };
  }

  if (/^note\s+/i.test(input)) {
    const title = input.replace(/^note\s+/i, "").trim();
    if (title) return { type: "create-note", title };
  }

  if (/^(remind|reminder)\s+/i.test(input)) {
    const rest = input.replace(/^(remind|reminder)\s+/i, "").trim();
    const remindAt = parseRemindTime(rest) ?? addHours(new Date(), 1);
    const title = stripTimePhrases(rest);
    if (title) return { type: "create-reminder", title, remindAt };
  }

  if (/^play\s+/i.test(input)) {
    const query = input.replace(/^play\s+/i, "").trim();
    if (query.length >= 3) return { type: "music-search", query };
  }

  if (/^(bookmark|save|link)\s+/i.test(input)) {
    const rest = input.replace(/^(bookmark|save|link)\s+/i, "").trim();
    const urlMatch = rest.match(/https?:\/\/\S+/i);
    if (urlMatch) {
      const url = urlMatch[0];
      const title = rest.replace(url, "").trim();
      return {
        type: "create-bookmark",
        url,
        title: title || bookmarkTitleFromUrl(url),
      };
    }
  }

  if (/^https?:\/\//i.test(input)) {
    return {
      type: "create-bookmark",
      url: input.trim(),
      title: bookmarkTitleFromUrl(input.trim()),
    };
  }

  if (lower === "music" || lower === "search music") {
    return { type: "navigate", href: "/music/search", label: "Music search" };
  }

  return { type: "unknown", raw: input };
}

export function describeCommand(command: ParsedCommand): string {
  switch (command.type) {
    case "navigate":
      return `Go to ${command.label}`;
    case "create-task":
      return `Create task: ${command.title}`;
    case "create-note":
      return `Create note: ${command.title}`;
    case "create-reminder":
      return `Create reminder: ${command.title}`;
    case "music-search":
      return `Search music: ${command.query}`;
    case "create-bookmark":
      return `Save bookmark: ${command.title}`;
    default:
      return command.raw ? `No matching command` : "Type a command…";
  }
}
