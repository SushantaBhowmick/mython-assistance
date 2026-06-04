"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Keeps Supabase session fresh in the PWA (auto refresh token before expiry).
 */
const isConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string";

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isConfigured) return;

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        // Session cookies updated by @supabase/ssr on next server request
      }
    });

    const interval = window.setInterval(() => {
      void supabase.auth.getSession();
    }, 10 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
}
