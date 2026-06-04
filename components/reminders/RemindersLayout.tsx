"use client";

import { Bell } from "lucide-react";

import { ModuleNav } from "@/components/shell/ModuleNav";
import { ServicePageHeader } from "@/components/shell/ServicePageHeader";

export function RemindersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ServicePageHeader
        eyebrow="Alerts"
        title="Reminders"
        description="Scheduled alerts linked to tasks and notes. Enable push in Settings."
        icon={Bell}
      />

      <ModuleNav
        items={[
          {
            href: "/reminders",
            label: "All reminders",
            icon: Bell,
          },
        ]}
      />

      {children}
    </div>
  );
}
