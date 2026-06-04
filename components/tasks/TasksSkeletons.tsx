import { Skeleton } from "@/components/ui/skeleton";

export function TasksListSkeleton() {
  return (
    <div className="space-y-3" aria-busy aria-label="Loading tasks">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-xl border bg-card/50 p-4">
          <Skeleton className="size-5 shrink-0 rounded" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskEditorSkeleton() {
  return (
    <div className="space-y-4" aria-busy>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
