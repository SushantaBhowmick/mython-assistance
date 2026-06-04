"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface NoteMarkdownPreviewProps {
  content: string;
  className?: string;
}

export function NoteMarkdownPreview({ content, className }: NoteMarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <p className={cn("text-sm text-muted-foreground italic", className)}>
        Nothing to preview yet. Start writing in the editor.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "note-markdown max-w-none space-y-3 text-sm leading-relaxed",
        "[&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:font-medium [&_p]:text-foreground/90 [&_a]:text-primary [&_a]:underline",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
