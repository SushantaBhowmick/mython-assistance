import { Skeleton } from "@/components/ui/skeleton";

export function NotesListSkeleton() {
  return (
    <div className="space-y-3" aria-busy aria-label="Loading notes">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="rounded-xl border bg-card/50 p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-3 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function NoteEditorSkeleton() {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading note">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
