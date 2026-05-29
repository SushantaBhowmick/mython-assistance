import { ListMusic } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlaylistSummary } from "@/types/music";

interface PlaylistCardProps {
  playlist: PlaylistSummary;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link href={`/music/playlists/${playlist.id}`}>
      <Card className="h-full transition-colors hover:bg-accent/40">
        <CardHeader className="pb-2">
          <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ListMusic className="size-5" />
          </div>
          <CardTitle className="line-clamp-2 text-base">{playlist.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {playlist.description || "No description"}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
