import { Suspense } from "react";
import { Plug } from "lucide-react";

import { GoogleCalendarConnect } from "@/components/settings/GoogleCalendarConnect";
import { Skeleton } from "@/components/ui/skeleton";

export default function IntegrationsSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-background/80">
            <Plug className="size-6 text-primary" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect external accounts. Tasks with due dates sync to Google Calendar.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
        <GoogleCalendarConnect />
      </Suspense>
    </div>
  );
}
