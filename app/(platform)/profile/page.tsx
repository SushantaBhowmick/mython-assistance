"use client";

import { useEffect, useState } from "react";

import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { ProfileView } from "@/components/profile/ProfileView";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "@/modules/profile/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load profile");
        }
        return res.json();
      })
      .then((data: { profile: UserProfile }) => setProfile(data.profile))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personal information and account security.
        </p>
      </div>

      {loading && (
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
          <p className="mt-2 text-muted-foreground">
            Run <code className="text-xs">npm run seed:owner</code> after configuring Supabase.
          </p>
        </div>
      )}

      {profile && <ProfileView profile={profile} />}

      <ChangePasswordForm />
    </div>
  );
}
