"use client";

import { BookOpen } from "lucide-react";

import { ModuleNav } from "@/components/shell/ModuleNav";
import { ServicePageHeader } from "@/components/shell/ServicePageHeader";

export function LearningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ServicePageHeader
        eyebrow="Learning"
        title="Learning"
        description="Track courses, topics, and study sessions."
        icon={BookOpen}
      />

      <ModuleNav
        items={[
          {
            href: "/learning",
            label: "Courses",
            icon: BookOpen,
          },
        ]}
      />

      {children}
    </div>
  );
}
