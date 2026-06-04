"use client";

import { useCallback, useState } from "react";

import { GlobalCommandPalette } from "@/components/shell/GlobalCommandPalette";
import { CommandPaletteContext } from "@/lib/command/palette-context";

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);

  return (
    <CommandPaletteContext.Provider value={{ openPalette }}>
      {children}
      <GlobalCommandPalette open={open} onOpenChange={setOpen} />
    </CommandPaletteContext.Provider>
  );
}
