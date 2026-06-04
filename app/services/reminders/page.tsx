import { redirect } from "next/navigation";

export default function LegacyRemindersRedirect() {
  redirect("/reminders");
}
