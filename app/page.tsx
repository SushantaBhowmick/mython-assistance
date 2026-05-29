import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="max-w-xl space-y-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Mython</h1>
        <p className="text-lg text-muted-foreground">
          Your personal assistant PWA. MVP 1 starts with a Spotify-like music player
          powered by YouTube search and embed playback.
        </p>
        <Button asChild size="lg">
          <Link href="/music">Open Music</Link>
        </Button>
      </div>
    </div>
  );
}
