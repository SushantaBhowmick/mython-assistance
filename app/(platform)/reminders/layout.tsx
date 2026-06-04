import { RemindersLayout } from "@/components/reminders/RemindersLayout";

export default function RemindersSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RemindersLayout>{children}</RemindersLayout>;
}
