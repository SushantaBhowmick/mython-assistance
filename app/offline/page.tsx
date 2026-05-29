"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <WifiOff className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">You are offline</h1>
        <p className="max-w-md text-muted-foreground">
          Mython needs internet for YouTube search and playback. Your cached app
          shell is still available.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.reload()}>Retry</Button>
        <Button asChild variant="secondary">
          <Link href="/music">Open Music</Link>
        </Button>
      </div>
    </div>
  );
}
