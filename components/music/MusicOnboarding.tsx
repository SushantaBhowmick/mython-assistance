"use client";

import Link from "next/link";
import { Heart, ListMusic, Search } from "lucide-react";

import { InstallPWAButton } from "@/components/pwa/InstallPWAButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function MusicOnboarding() {
  return (
    <Card className="border-dashed">
      <CardContent className="space-y-5 p-6">
        <div>
          <h2 className="text-lg font-semibold">Welcome to Music</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with a search, save favorites, and build playlists. Everything
            here is powered by your library — no automatic YouTube calls.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="justify-start gap-2">
            <Link href="/music/search">
              <Search className="size-4" />
              Search your first song
            </Link>
          </Button>
          <Button asChild variant="secondary" className="justify-start gap-2">
            <Link href="/music/favorites">
              <Heart className="size-4" />
              Save favorites
            </Link>
          </Button>
          <Button asChild variant="secondary" className="justify-start gap-2">
            <Link href="/music/playlists">
              <ListMusic className="size-4" />
              Create a playlist
            </Link>
          </Button>
          <InstallPWAButton variant="outline" className="justify-start" />
        </div>

        <Button asChild variant="link" className="h-auto p-0 text-sm">
          <Link href="/settings/notifications">Enable notifications</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
