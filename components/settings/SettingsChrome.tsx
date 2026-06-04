"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/shell/BrandMark";
import { PlatformBackdrop } from "@/components/shell/PlatformBackdrop";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/player-store";

export function SettingsChrome({ children }: { children: React.ReactNode }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  return (
    <div
      className={cn(
        "relative mx-auto min-h-screen max-w-3xl px-4 py-6 safe-top",
        currentTrack
          ? "pb-[calc(10rem+env(safe-area-inset-bottom))]"
          : "pb-[calc(2rem+env(safe-area-inset-bottom))]",
      )}
    >
      <PlatformBackdrop />
      <div className="relative mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandMark size="sm" />
          <Button asChild variant="ghost" size="sm" className="-ml-1">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Home
            </Link>
          </Button>
        </div>
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
