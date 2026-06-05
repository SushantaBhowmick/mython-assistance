"use client";

import { CalendarClock, ExternalLink, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobApplicationDetail } from "@/modules/career/types";

interface ApplicationCardProps {
  application: JobApplicationDetail;
  busy?: boolean;
  onDelete: (id: string) => void;
}

function statusVariant(status: JobApplicationDetail["status"]) {
  if (status === "OFFER") return "default";
  if (status === "REJECTED" || status === "WITHDRAWN") return "destructive";
  return "secondary";
}

export function ApplicationCard({ application, busy, onDelete }: ApplicationCardProps) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium leading-snug">
              {application.company} · {application.role}
            </h2>
            <Badge variant={statusVariant(application.status)}>
              {application.status.toLowerCase().replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {application.location || "Location not set"} · {application.interviewsCount} interview
            {application.interviewsCount === 1 ? "" : "s"}
          </p>
          {application.nextInterviewAt ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <CalendarClock className="size-4" />
              Next interview: {new Date(application.nextInterviewAt).toLocaleString()}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          aria-label="Delete application"
          onClick={() => onDelete(application.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {application.jobUrl ? (
          <Button asChild size="sm" variant="outline">
            <a href={application.jobUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Open listing
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
