"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { createNote } from "@/lib/notes/api-client";

export default function NewNotePage() {
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    createNote({ title: "Untitled note", body: "", tags: [] })
      .then(({ note }) => {
        router.replace(`/notes/${note.id}`);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not create note");
        router.replace("/notes");
      });
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="mt-4 text-sm">Creating note…</p>
    </div>
  );
}
