import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MusicSectionSkeletonProps {
  titleWidth?: string;
  withDescription?: boolean;
  withAction?: boolean;
  children: React.ReactNode;
}

export function MusicSectionSkeleton({
  titleWidth = "w-40",
  withDescription = false,
  withAction = false,
  children,
}: MusicSectionSkeletonProps) {
  return (
    <section className="space-y-3" aria-busy="true" aria-label="Loading section">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className={cn("h-6", titleWidth)} />
          {withDescription && <Skeleton className="h-4 w-72 max-w-full" />}
        </div>
        {withAction && <Skeleton className="h-8 w-24 shrink-0" />}
      </div>
      {children}
    </section>
  );
}

export function MusicTrackTileSkeleton() {
  return (
    <div className="w-36 shrink-0">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1.5 h-3 w-[80%]" />
    </div>
  );
}

interface MusicTrackRowSkeletonProps {
  count?: number;
}

export function MusicTrackRowSkeleton({ count = 5 }: MusicTrackRowSkeletonProps) {
  return (
    <div className="-mx-1 flex gap-3 overflow-hidden px-1 pb-2">
      {Array.from({ length: count }, (_, index) => (
        <MusicTrackTileSkeleton key={index} />
      ))}
    </div>
  );
}

export function MusicTrackCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border bg-card/50 p-3 sm:p-4">
      <Skeleton className="size-24 shrink-0 rounded-lg sm:size-28" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <Skeleton className="h-5 w-3/4 max-w-xs" />
        <Skeleton className="h-4 w-1/2 max-w-[10rem]" />
        <div className="mt-1 flex gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}

interface MusicPlaylistGridSkeletonProps {
  count?: number;
}

export function MusicPlaylistGridSkeleton({ count = 3 }: MusicPlaylistGridSkeletonProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-[4.5rem] rounded-xl" />
      ))}
    </div>
  );
}

interface MusicTrackListSkeletonProps {
  count?: number;
  withMeta?: boolean;
}

export function MusicTrackListSkeleton({
  count = 6,
  withMeta = false,
}: MusicTrackListSkeletonProps) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading tracks">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-1">
          {withMeta && <Skeleton className="mx-1 h-3 w-48" />}
          <MusicTrackCardSkeleton />
        </div>
      ))}
    </div>
  );
}

interface MusicPlaylistCardsSkeletonProps {
  count?: number;
}

export function MusicPlaylistCardsSkeleton({ count = 6 }: MusicPlaylistCardsSkeletonProps) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading playlists"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-xl border bg-card/50 p-6">
          <Skeleton className="mb-3 size-12 rounded-lg" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function MusicPlaylistDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading playlist">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28 shrink-0" />
      </div>
      <MusicTrackListSkeleton count={5} />
    </div>
  );
}

export function MusicSearchResultsSkeleton() {
  return <MusicTrackListSkeleton count={5} />;
}

export function MusicHomeDiscoverySkeletons() {
  return (
    <div className="space-y-8">
      <MusicSectionSkeleton titleWidth="w-44" withDescription>
        <MusicTrackCardSkeleton />
      </MusicSectionSkeleton>

      <MusicSectionSkeleton titleWidth="w-36" withAction>
        <MusicTrackRowSkeleton />
      </MusicSectionSkeleton>

      <MusicSectionSkeleton titleWidth="w-28" withDescription withAction>
        <MusicTrackRowSkeleton />
      </MusicSectionSkeleton>

      <MusicSectionSkeleton titleWidth="w-24" withAction>
        <MusicTrackRowSkeleton count={4} />
      </MusicSectionSkeleton>

      <MusicSectionSkeleton titleWidth="w-32" withAction>
        <MusicPlaylistGridSkeleton />
      </MusicSectionSkeleton>

      <MusicSectionSkeleton titleWidth="w-44" withDescription withAction>
        <MusicTrackRowSkeleton />
      </MusicSectionSkeleton>

      <MusicSectionSkeleton titleWidth="w-40" withDescription>
        <MusicTrackRowSkeleton count={4} />
      </MusicSectionSkeleton>
    </div>
  );
}
