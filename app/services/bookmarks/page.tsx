import { redirect } from "next/navigation";

export default function LegacyBookmarksRedirect() {
  redirect("/bookmarks");
}
