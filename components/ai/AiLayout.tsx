"use client";

import { Sparkles } from "lucide-react";

import { ModuleNav } from "@/components/shell/ModuleNav";
import { ServicePageHeader } from "@/components/shell/ServicePageHeader";

export function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ServicePageHeader
        eyebrow="Intelligence"
        title="Today brief"
        description="AI-powered daily plan from your tasks, reminders, learning, and career data."
        icon={Sparkles}
      />

      <ModuleNav
        items={[
          {
            href: "/ai",
            label: "Brief",
            icon: Sparkles,
          },
        ]}
      />

      {children}
    </div>
  );
}
