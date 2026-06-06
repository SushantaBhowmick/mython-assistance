"use client";

import { format } from "date-fns";
import { Loader2, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AiBriefSummary } from "@/modules/ai/types";

function TodayBriefPanelInner() {
  const searchParams = useSearchParams();
  const [briefs, setBriefs] = useState<AiBriefSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [configured, setConfigured] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/briefs", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBriefs(data.briefs ?? []);
      }
    } catch {
      setBriefs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function generateBrief() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/today-brief", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) setConfigured(false);
        throw new Error(data.error ?? "Failed to generate brief");
      }
      setConfigured(true);
      setBriefs((prev) => [data.brief, ...prev].slice(0, 10));
      toast.success("Today brief generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    if (searchParams.get("generate") === "1" && !loading && !generating) {
      void generateBrief();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loading]);

  const latest = briefs[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void generateBrief()} disabled={generating}>
          {generating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Generate today brief
        </Button>
        {!configured && (
          <p className="text-sm text-muted-foreground">
            Add <code className="text-xs">GEMINI_API_KEY</code> to your environment to enable AI.
          </p>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : latest ? (
        <article className="prose prose-sm dark:prose-invert max-w-none rounded-2xl border bg-card/60 p-6 backdrop-blur-sm">
          <p className="!mt-0 text-xs text-muted-foreground">
            Generated {format(new Date(latest.createdAt), "MMM d, yyyy h:mm a")}
          </p>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{latest.content}</ReactMarkdown>
        </article>
      ) : (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          No brief yet. Generate one to get a personalized plan for today.
        </div>
      )}

      {briefs.length > 1 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            History
          </h2>
          <ul className="space-y-2">
            {briefs.slice(1).map((brief) => (
              <li
                key={brief.id}
                className="rounded-lg border bg-background/60 px-3 py-2 text-sm text-muted-foreground"
              >
                {format(new Date(brief.createdAt), "MMM d, h:mm a")} —{" "}
                {brief.content.split("\n")[0]?.replace(/^#+\s*/, "") ?? "Brief"}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function TodayBriefPanel() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}>
      <TodayBriefPanelInner />
    </Suspense>
  );
}
