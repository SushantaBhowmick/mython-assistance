"use client";

import { ListTodo, Plus } from "lucide-react";
import Link from "next/link";

import { ModuleNav } from "@/components/shell/ModuleNav";
import { ServicePageHeader } from "@/components/shell/ServicePageHeader";
import { Button } from "@/components/ui/button";

export function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ServicePageHeader
        eyebrow="Productivity"
        title="Tasks"
        description="Priorities, due dates, and daily planning."
        icon={ListTodo}
        actions={
          <Button asChild>
            <Link href="/tasks/new">
              <Plus className="size-4" />
              New task
            </Link>
          </Button>
        }
      />

      <ModuleNav
        items={[
          {
            href: "/tasks",
            label: "All tasks",
            icon: ListTodo,
            match: (p) => p === "/tasks" || (p.startsWith("/tasks/") && p !== "/tasks/new"),
          },
        ]}
      />

      {children}
    </div>
  );
}
