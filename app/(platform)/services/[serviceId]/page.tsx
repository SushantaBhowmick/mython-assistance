import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";

/** Placeholder only for services not yet in the registry as active. */
const VALID_IDS: string[] = [];

interface PageProps {
  params: Promise<{ serviceId: string }>;
}

export default async function ServicePlaceholderPage({ params }: PageProps) {
  const { serviceId } = await params;

  if (!VALID_IDS.includes(serviceId)) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Button asChild className="mt-8">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
