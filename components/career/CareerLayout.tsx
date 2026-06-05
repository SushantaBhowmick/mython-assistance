"use client";

import { Brain } from "lucide-react";

import { ModuleNav } from "@/components/shell/ModuleNav";
import { ServicePageHeader } from "@/components/shell/ServicePageHeader";

export function CareerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ServicePageHeader
        eyebrow="Career"
        title="Career"
        description="Track job applications and interview pipeline."
        icon={Brain}
      />

      <ModuleNav
        items={[
          {
            href: "/career",
            label: "Applications",
            icon: Brain,
          },
        ]}
      />

      {children}
    </div>
  );
}
