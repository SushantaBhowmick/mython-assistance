"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { BrandMark } from "@/components/shell/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success("Check your email for a reset link.");
    } catch {
      toast.error("Could not send reset email. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/25 via-background to-background"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-1/4 size-72 rounded-full bg-emerald-500/15 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="lg" link={false} className="mb-4" />
          <p className="text-sm text-muted-foreground">
            {sent ? "Reset link sent" : "Recover access to your workspace"}
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border bg-card/70 p-6 shadow-xl backdrop-blur-md sm:p-8">
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>,
                you will receive a password reset link shortly. Open it on this device to set a new
                password.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="size-4" />
                  Back to sign in
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-9"
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>

              <p className="text-center text-sm">
                <Link href="/login" className="text-muted-foreground underline-offset-4 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
