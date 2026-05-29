"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/music/EmptyState";
import { LoadingState } from "@/components/music/LoadingState";
import { MusicTrackCard } from "@/components/music/MusicTrackCard";
import { ShufflePlayButton } from "@/components/music/ShufflePlayButton";
import { Button } from "@/components/ui/button";
import { getHistory } from "@/lib/music/api-client";
import type { HistoryEntry } from "@/types/music";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"recent" | "most-played">("recent");

  useEffect(() => {
    setLoading(true);
    getHistory({ sort, limit: 50 })
      .then(({ history: data }) => setHistory(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"))
      .finally(() => setLoading(false));
  }, [sort]);

  const tracks = history.map((entry) => entry.track);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="text-muted-foreground">
            Each song appears once with play count and last played time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sort === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("recent")}
          >
            Recent
          </Button>
          <Button
            variant={sort === "most-played" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("most-played")}
          >
            Most played
          </Button>
          {tracks.length > 0 && <ShufflePlayButton tracks={tracks} />}
        </div>
      </div>

      {loading && <LoadingState label="Loading history..." />}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <EmptyState
          title="No history yet"
          description="Play a song from search and it will appear here."
        />
      )}

      {!loading && !error && history.length > 0 && (
        <div className="space-y-3">
          {history.map((entry) => (
            <div key={entry.track.id} className="space-y-1">
              <p className="px-1 text-xs text-muted-foreground">
                {entry.playCount} play{entry.playCount === 1 ? "" : "s"} · Last played{" "}
                {new Date(entry.lastPlayedAt).toLocaleString()}
              </p>
              <MusicTrackCard
                track={entry.track}
                queue={tracks}
                savedTrackId={entry.track.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
