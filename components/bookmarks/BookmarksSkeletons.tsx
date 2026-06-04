import { Skeleton } from "@/components/ui/skeleton";

export function BookmarksListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-xl border p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-3 h-8 w-24" />
        </div>
      ))}
    </div>
  );
}
