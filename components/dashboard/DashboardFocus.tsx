"use client";

import { Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DashboardFocusProps {
  initialFocus: string | null;
  onUpdated: (focus: string | null) => void;
}

export function DashboardFocus({ initialFocus, onUpdated }: DashboardFocusProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialFocus ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/focus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus: value.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      onUpdated(data.focus ?? null);
      setEditing(false);
      toast.success("Focus updated");
    } catch {
      toast.error("Could not save focus");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {initialFocus ? (
            <>
              Focus: <span className="font-medium text-foreground">{initialFocus}</span>
            </>
          ) : (
            "Set a focus for today"
          )}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setValue(initialFocus ?? "");
            setEditing(true);
          }}
          aria-label="Edit focus"
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex max-w-md items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Today's focus…"
        className="h-9"
        onKeyDown={(e) => {
          if (e.key === "Enter") void save();
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <Button type="button" size="icon-sm" onClick={() => void save()} disabled={saving}>
        <Check className="size-4" />
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" onClick={() => setEditing(false)}>
        <X className="size-4" />
      </Button>
    </div>
  );
}
