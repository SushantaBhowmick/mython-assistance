import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ServicePageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function ServicePageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  className,
}: ServicePageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 rounded-2xl border bg-card/50 p-5 shadow-sm backdrop-blur-sm sm:p-6",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        {Icon ? (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-background/80 shadow-sm">
            <Icon className="size-6 text-primary" />
          </div>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
