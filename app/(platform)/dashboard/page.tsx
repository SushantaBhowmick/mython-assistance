import { ServiceCard } from "@/components/shell/ServiceCard";
import { PERSONAL_SERVICES } from "@/lib/services/registry";

export default function DashboardPage() {
  const serviceIds = PERSONAL_SERVICES.filter((s) => s.id !== "dashboard").map(
    (s) => s.id,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Command center</h1>
        <p className="mt-1 text-muted-foreground">
          Choose a service — each module runs independently. Nothing loads until you open it.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Services
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceIds.map((id) => (
            <ServiceCard key={id} serviceId={id} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">How Personal OS works</p>
        <ul className="mt-3 list-inside list-disc space-y-1">
          <li>Dashboard is only a launcher — not a combined homepage.</li>
          <li>Music keeps playing globally while you use other services.</li>
          <li>Tasks, Notes, Reminders, and Bookmarks are live — more modules ship one at a time.</li>
        </ul>
      </section>
    </div>
  );
}
