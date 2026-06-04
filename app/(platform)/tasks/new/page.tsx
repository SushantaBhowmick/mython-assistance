"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { createTask } from "@/lib/tasks/api-client";

export default function NewTaskPage() {
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    createTask({ title: "New task" })
      .then(({ task }) => router.replace(`/tasks/${task.id}`))
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not create task");
        router.replace("/tasks");
      });
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="mt-4 text-sm">Creating task…</p>
    </div>
  );
}
