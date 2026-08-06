import { NotesLayout } from "@/components/notes/NotesLayout";
import { NotesVaultGate } from "@/components/notes/NotesVaultGate";

export default function NotesSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotesVaultGate>
      <NotesLayout>{children}</NotesLayout>
    </NotesVaultGate>
  );
}
