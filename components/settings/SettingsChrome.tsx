"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/player-store";

export function SettingsChrome({ children }: { children: React.ReactNode }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  return (
    <div
      className={cn(
        "mx-auto min-h-screen max-w-3xl px-4 py-6 safe-top",
        currentTrack
          ? "pb-[calc(10rem+env(safe-area-inset-bottom))]"
          : "pb-[calc(2rem+env(safe-area-inset-bottom))]",
      )}
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/music">
            <ArrowLeft className="size-4" />
            Back to music
          </Link>
        </Button>
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
