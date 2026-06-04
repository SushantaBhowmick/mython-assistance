import { createBookmark } from "@/lib/bookmarks/api-client";
import { createNote } from "@/lib/notes/api-client";
import { createReminder } from "@/lib/reminders/api-client";
import { createTask } from "@/lib/tasks/api-client";

import type { ParsedCommand } from "@/lib/command/parse-command";

export type CommandExecuteResult =
  | { ok: true; href: string; message: string }
  | { ok: false; message: string };

export async function executeCommand(command: ParsedCommand): Promise<CommandExecuteResult> {
  try {
    switch (command.type) {
      case "navigate":
        return { ok: true, href: command.href, message: `Opening ${command.label}` };

      case "create-task": {
        const { task } = await createTask({ title: command.title });
        return {
          ok: true,
          href: `/tasks/${task.id}`,
          message: `Task created: ${task.title}`,
        };
      }

      case "create-note": {
        const { note } = await createNote({ title: command.title, body: "" });
        return {
          ok: true,
          href: `/notes/${note.id}`,
          message: `Note created: ${note.title}`,
        };
      }

      case "create-reminder": {
        const { reminder } = await createReminder({
          title: command.title,
          remindAt: command.remindAt.toISOString(),
        });
        return {
          ok: true,
          href: "/reminders",
          message: `Reminder set: ${reminder.title}`,
        };
      }

      case "music-search":
        return {
          ok: true,
          href: `/music/search?q=${encodeURIComponent(command.query)}`,
          message: `Searching: ${command.query}`,
        };

      case "create-bookmark": {
        const { bookmark } = await createBookmark({
          title: command.title,
          url: command.url,
        });
        return {
          ok: true,
          href: "/bookmarks",
          message: `Bookmark saved: ${bookmark.title}`,
        };
      }

      default:
        return {
          ok: false,
          message: "Unknown command. Try: task …, note …, remind …, bookmark …, play …",
        };
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Command failed",
    };
  }
}
