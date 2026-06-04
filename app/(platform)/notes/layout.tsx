import { NotesLayout } from "@/components/notes/NotesLayout";

export default function NotesSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NotesLayout>{children}</NotesLayout>;
}
