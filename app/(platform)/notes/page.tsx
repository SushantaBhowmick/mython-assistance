import { Suspense } from "react";

import { NotesList } from "@/components/notes/NotesList";
import { NotesListSkeleton } from "@/components/notes/NotesSkeletons";

export default function NotesPage() {
  return (
    <Suspense fallback={<NotesListSkeleton />}>
      <NotesList />
    </Suspense>
  );
}
