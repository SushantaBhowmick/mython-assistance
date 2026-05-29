import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MusicHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your music</h1>
        <p className="text-muted-foreground">
          Search YouTube, build playlists, and keep your favorites in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Find songs and play them with the YouTube player.
            </p>
            <Button asChild>
              <Link href="/music/search">Start searching</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Library</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/music/favorites">Favorites</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/music/playlists">Playlists</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/music/history">History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
