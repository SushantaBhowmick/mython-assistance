"use client";

import { Wallet } from "lucide-react";

import { ModuleNav } from "@/components/shell/ModuleNav";
import { ServicePageHeader } from "@/components/shell/ServicePageHeader";

export function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ServicePageHeader
        eyebrow="Finance"
        title="Finance"
        description="Track transactions, categories, and monthly summary."
        icon={Wallet}
      />

      <ModuleNav
        items={[
          {
            href: "/finance",
            label: "Overview",
            icon: Wallet,
          },
        ]}
      />

      {children}
    </div>
  );
}
