import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Personal assistant preferences</p>
      </div>
      <Button asChild variant="secondary">
        <Link href="/settings/notifications">Notifications & install</Link>
      </Button>
    </div>
  );
}
