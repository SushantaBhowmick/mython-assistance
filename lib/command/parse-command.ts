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
  | { type: "create-course"; title: string }
  | { type: "create-application"; company: string; role: string }
  | { type: "create-transaction"; txType: "EXPENSE" | "INCOME"; amount: string; description: string }
  | { type: "set-focus"; focus: string }
  | { type: "generate-brief" }
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
  learning: "learning",
  learn: "learning",
  course: "learning",
  courses: "learning",
  career: "career",
  jobs: "career",
  job: "career",
  finance: "finance",
  money: "finance",
  ai: "ai",
  automation: "automation",
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

  if (lower === "brief" || lower === "today" || lower === "today brief") {
    return { type: "generate-brief" };
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

  if (/^focus\s+/i.test(input)) {
    const focus = input.replace(/^focus\s+/i, "").trim();
    if (focus) return { type: "set-focus", focus };
  }

  if (/^(learn|course)\s+/i.test(input)) {
    const title = input.replace(/^(learn|course)\s+/i, "").trim();
    if (title) return { type: "create-course", title };
  }

  if (/^apply\s+/i.test(input)) {
    const rest = input.replace(/^apply\s+/i, "").trim();
    const at = rest.match(/\s+at\s+/i);
    if (at) {
      const [role, company] = rest.split(/\s+at\s+/i);
      if (role && company) {
        return { type: "create-application", role: role.trim(), company: company.trim() };
      }
    }
    const parts = rest.split(/\s+/);
    if (parts.length >= 2) {
      return {
        type: "create-application",
        company: parts[0]!,
        role: parts.slice(1).join(" "),
      };
    }
  }

  if (/^expense\s+/i.test(input)) {
    const parsed = parseMoneyCommand(input.replace(/^expense\s+/i, "").trim(), "EXPENSE");
    if (parsed) return parsed;
  }

  if (/^income\s+/i.test(input)) {
    const parsed = parseMoneyCommand(input.replace(/^income\s+/i, "").trim(), "INCOME");
    if (parsed) return parsed;
  }

  return { type: "unknown", raw: input };
}

function parseMoneyCommand(
  rest: string,
  txType: "EXPENSE" | "INCOME",
): ParsedCommand | null {
  const amountLast = rest.match(/^(.+?)\s+(\d+(?:\.\d{1,2})?)$/);
  if (amountLast) {
    return {
      type: "create-transaction",
      txType,
      amount: amountLast[2]!,
      description: amountLast[1]!.trim(),
    };
  }

  const amountFirst = rest.match(/^(\d+(?:\.\d{1,2})?)\s+(.+)$/);
  if (amountFirst) {
    return {
      type: "create-transaction",
      txType,
      amount: amountFirst[1]!,
      description: amountFirst[2]!.trim(),
    };
  }

  return null;
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
    case "create-course":
      return `Create course: ${command.title}`;
    case "create-application":
      return `Apply: ${command.role} at ${command.company}`;
    case "create-transaction":
      return `${command.txType === "EXPENSE" ? "Expense" : "Income"}: ${command.description} (${command.amount})`;
    case "set-focus":
      return `Set focus: ${command.focus}`;
    case "generate-brief":
      return "Generate today's AI brief";
    default:
      return command.raw ? `No matching command` : "Type a command…";
  }
}
