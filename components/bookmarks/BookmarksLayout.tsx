"use client";

import { Bookmark } from "lucide-react";

import { ModuleNav } from "@/components/shell/ModuleNav";
import { ServicePageHeader } from "@/components/shell/ServicePageHeader";

export function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ServicePageHeader
        eyebrow="References"
        title="Bookmarks"
        description="Save links for later — articles, docs, and references."
        icon={Bookmark}
      />

      <ModuleNav
        items={[
          {
            href: "/bookmarks",
            label: "All bookmarks",
            icon: Bookmark,
          },
        ]}
      />

      {children}
    </div>
  );
}
