"use client";

import type { ReactNode } from "react";

interface MusicSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function MusicSection({
  title,
  description,
  action,
  children,
}: MusicSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
