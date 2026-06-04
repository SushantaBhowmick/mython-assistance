"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/lib/command/palette-context";
import { cn } from "@/lib/utils";

export function CommandPaletteTrigger({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { openPalette } = useCommandPalette();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  if (compact) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className={cn("shrink-0", className)}
        onClick={openPalette}
        aria-label="Open command palette"
      >
        <Search className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-8 gap-2 text-muted-foreground", className)}
      onClick={openPalette}
    >
      <Search className="size-3.5" />
      <span className="hidden sm:inline">Command</span>
      <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">
        {isMac ? "⌘K" : "Ctrl+K"}
      </kbd>
    </Button>
  );
}
