"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getServiceById, type ServiceId } from "@/lib/services/registry";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  serviceId: ServiceId;
}

const statusLabel = {
  active: null,
  coming_soon: "Soon",
  planned: "Planned",
} as const;

export function ServiceCard({ serviceId }: ServiceCardProps) {
  const service = getServiceById(serviceId);
  if (!service) return null;

  const Icon = service.icon;
  const isActive = service.status === "active";

  const content = (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/50 p-5 transition-all",
        isActive
          ? "hover:border-primary/40 hover:bg-card/80 hover:shadow-lg"
          : "cursor-default opacity-80",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-100",
          service.accent,
        )}
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex size-11 items-center justify-center rounded-xl border bg-background/80 shadow-sm">
            <Icon className="size-5 text-primary" />
          </div>
          {statusLabel[service.status] && (
            <Badge variant="secondary">{statusLabel[service.status]}</Badge>
          )}
        </div>
        <h3 className="text-lg font-semibold tracking-tight">{service.name}</h3>
        <p className="mt-1 flex-1 text-sm text-muted-foreground">{service.description}</p>
        {isActive && (
          <p className="mt-4 text-xs font-medium text-primary">Open service →</p>
        )}
      </div>
    </div>
  );

  if (!isActive) {
    return content;
  }

  return (
    <Link href={service.href} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
      {content}
    </Link>
  );
}
