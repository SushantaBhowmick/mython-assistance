export interface BookmarkSummary {
  id: string;
  title: string;
  url: string;
  description: string | null;
  noteId: string | null;
  createdAt: string;
  updatedAt: string;
}
