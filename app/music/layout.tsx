import { MusicLayout } from "@/components/music/MusicLayout";

export default function MusicSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MusicLayout>{children}</MusicLayout>;
}
