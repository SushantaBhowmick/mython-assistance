export interface NoteSummary {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDetail extends NoteSummary {
  body: string;
}
