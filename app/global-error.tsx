"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Mython hit a problem</h1>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected application error occurred."}
          </p>
          <Button onClick={reset}>Reload app</Button>
        </div>
      </body>
    </html>
  );
}
