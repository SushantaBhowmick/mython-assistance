import { createBookmark } from "@/lib/bookmarks/api-client";
import { createApplication } from "@/lib/career/api-client";
import { createCourse } from "@/lib/learning/api-client";
import { createTransaction } from "@/lib/finance/api-client";
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

      case "create-course": {
        const { course } = await createCourse({ title: command.title });
        return {
          ok: true,
          href: "/learning",
          message: `Course created: ${course.title}`,
        };
      }

      case "create-application": {
        const { application } = await createApplication({
          company: command.company,
          role: command.role,
          status: "APPLIED",
          appliedAt: new Date().toISOString(),
        });
        return {
          ok: true,
          href: "/career",
          message: `Application added: ${application.role} at ${application.company}`,
        };
      }

      case "create-transaction": {
        await createTransaction({
          type: command.txType,
          amount: command.amount,
          description: command.description,
          occurredAt: new Date().toISOString(),
        });
        return {
          ok: true,
          href: "/finance",
          message: `${command.txType === "EXPENSE" ? "Expense" : "Income"} logged`,
        };
      }

      case "set-focus": {
        const res = await fetch("/api/dashboard/focus", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ focus: command.focus }),
        });
        if (!res.ok) throw new Error("Failed to set focus");
        return {
          ok: true,
          href: "/dashboard",
          message: `Focus set: ${command.focus}`,
        };
      }

      default:
        return {
          ok: false,
          message: "Unknown command. Try: task …, learn …, apply …, expense …, play …",
        };
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Command failed",
    };
  }
}
