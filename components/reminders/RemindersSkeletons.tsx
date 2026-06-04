import { Skeleton } from "@/components/ui/skeleton";

export function RemindersListSkeleton() {
  return (
    <div className="space-y-3" aria-busy aria-label="Loading reminders">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="rounded-xl border bg-card/50 p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-3 h-8 w-40" />
        </div>
      ))}
    </div>
  );
}
