"use client";

import { Plus, StickyNote } from "lucide-react";
import Link from "next/link";

import { ModuleNav } from "@/components/shell/ModuleNav";
import { ServicePageHeader } from "@/components/shell/ServicePageHeader";
import { Button } from "@/components/ui/button";

export function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ServicePageHeader
        eyebrow="Knowledge"
        title="Notes"
        description="Password-locked markdown notes for confidential knowledge."
        icon={StickyNote}
        actions={
          <Button asChild>
            <Link href="/notes/new">
              <Plus className="size-4" />
              New note
            </Link>
          </Button>
        }
      />

      <ModuleNav
        items={[
          {
            href: "/notes",
            label: "All notes",
            icon: StickyNote,
            match: (p) => p === "/notes" || (p.startsWith("/notes/") && p !== "/notes/new"),
          },
        ]}
      />

      {children}
    </div>
  );
}
