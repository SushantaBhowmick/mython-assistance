"use client";

import { createContext, useContext } from "react";

interface CommandPaletteContextValue {
  openPalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    return { openPalette: () => undefined };
  }
  return ctx;
}

export { CommandPaletteContext };
