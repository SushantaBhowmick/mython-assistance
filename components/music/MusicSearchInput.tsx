"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MusicSearchInputProps {
  onSearch: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MusicSearchInput({
  onSearch,
  disabled = false,
  placeholder = "Search songs, artists, albums...",
}: MusicSearchInputProps) {
  const [localValue, setLocalValue] = useState("");

  function submitSearch() {
    onSearch(localValue.trim());
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          placeholder={placeholder}
          className="h-11 pl-9"
          disabled={disabled}
        />
      </div>
      <Button type="submit" className="h-11 px-5" disabled={disabled}>
        Search
      </Button>
    </form>
  );
}
