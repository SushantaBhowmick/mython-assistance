import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getServiceById, type ServiceId } from "@/lib/services/registry";

const VALID_IDS: ServiceId[] = [
  "ai",
  "automation",
];

interface PageProps {
  params: Promise<{ serviceId: string }>;
}

export default async function ServicePlaceholderPage({ params }: PageProps) {
  const { serviceId } = await params;

  if (!VALID_IDS.includes(serviceId as ServiceId)) {
    notFound();
  }

  const service = getServiceById(serviceId as ServiceId);
  if (!service || service.status === "active") {
    notFound();
  }

  const Icon = service.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border bg-muted/50">
        <Icon className="size-8 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold">{service.name}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{service.description}</p>
      <p className="mt-4 text-sm capitalize text-muted-foreground">
        Status: {service.status.replace("_", " ")}
      </p>
      <Button asChild className="mt-8">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
