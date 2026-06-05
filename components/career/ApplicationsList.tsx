"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ApplicationCard } from "@/components/career/ApplicationCard";
import { ApplicationsListSkeleton } from "@/components/career/CareerSkeletons";
import { CreateApplicationDialog } from "@/components/career/CreateApplicationDialog";
import { EmptyState } from "@/components/music/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createInterview, deleteApplication, listApplications } from "@/lib/career/api-client";
import type { JobApplicationDetail, JobApplicationSummary } from "@/modules/career/types";

const filters: Array<JobApplicationSummary["status"] | "ALL"> = [
  "ALL",
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

export function ApplicationsList() {
  const [applications, setApplications] = useState<JobApplicationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof filters[number]>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listApplications({
        q: query.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      const details: JobApplicationDetail[] = result.applications.map((application) => ({
        ...application,
        interviews: [],
      }));
      setApplications(details);
      setDegraded(Boolean(result.degraded));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this application and interviews?")) return;
    setBusyId(id);
    try {
      await deleteApplication(id);
      setApplications((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete application");
    } finally {
      setBusyId(null);
    }
  }

  async function handleQuickInterview() {
    if (applications.length === 0) return;
    const first = applications[0];
    try {
      await createInterview({
        applicationId: first.id,
        scheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        type: "Screen",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create interview");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[12rem] flex-1 max-w-sm">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search applications..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleQuickInterview} disabled={applications.length === 0}>
            Add interview
          </Button>
          <CreateApplicationDialog onCreated={(application) => setApplications((prev) => [application, ...prev])} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter}
            type="button"
            size="sm"
            variant={statusFilter === filter ? "default" : "outline"}
            onClick={() => setStatusFilter(filter)}
          >
            {filter === "ALL" ? "All" : filter.toLowerCase().replace("_", " ")}
          </Button>
        ))}
      </div>

      {degraded && !loading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          Database was temporarily unavailable.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <ApplicationsListSkeleton />
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Track job search progress and upcoming interviews."
        />
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              busy={busyId === application.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
