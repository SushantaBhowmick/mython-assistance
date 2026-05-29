"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/music/EmptyState";
import { LoadingState } from "@/components/music/LoadingState";
import { MusicTrackCard } from "@/components/music/MusicTrackCard";
import { getHistory } from "@/lib/music/api-client";
import type { HistoryEntry } from "@/types/music";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHistory()
      .then(({ history: data }) => setHistory(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  const tracks = history.map((entry) => entry.track);

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recently played</h1>
          <p className="text-muted-foreground">Your last 50 played tracks.</p>
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
              <div key={entry.id} className="space-y-1">
                <p className="px-1 text-xs text-muted-foreground">
                  {new Date(entry.playedAt).toLocaleString()}
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
