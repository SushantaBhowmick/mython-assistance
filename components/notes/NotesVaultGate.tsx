"use client";

import { Loader2, Lock, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GateMode = "loading" | "setup" | "locked" | "unlocked";

export function NotesVaultGate({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<GateMode>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const res = await fetch("/api/notes/unlock", { cache: "no-store" });
        const data = (await res.json()) as {
          unlocked?: boolean;
          configured?: boolean;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setMode("locked");
          return;
        }
        if (data.unlocked) {
          setMode("unlocked");
        } else if (data.configured) {
          setMode("locked");
        } else {
          setMode("setup");
        }
      } catch {
        if (!cancelled) setMode("locked");
      }
    }

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  function resetFields() {
    setPassword("");
    setConfirm("");
    setCurrentPassword("");
  }

  async function handleSetup(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("Notes passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/notes/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });
      const data = (await res.json()) as { unlocked?: boolean; error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Could not set Notes password.");
        return;
      }

      resetFields();
      setMode("unlocked");
      toast.success("Notes password created.");
    } catch {
      toast.error("Could not set Notes password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/notes/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { unlocked?: boolean; error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Could not unlock notes.");
        return;
      }

      resetFields();
      setMode("unlocked");
      toast.success("Notes unlocked.");
    } catch {
      toast.error("Could not unlock notes.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("Notes passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/notes/unlock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password, confirm }),
      });
      const data = (await res.json()) as { unlocked?: boolean; error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Could not change Notes password.");
        return;
      }

      resetFields();
      setChanging(false);
      toast.success("Notes password updated.");
    } catch {
      toast.error("Could not change Notes password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLock() {
    try {
      await fetch("/api/notes/unlock", { method: "DELETE" });
      setChanging(false);
      resetFields();
      setMode("locked");
      toast.success("Notes locked.");
    } catch {
      toast.error("Could not lock notes.");
    }
  }

  if (mode === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (mode === "setup") {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col justify-center space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Lock className="size-5 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Create a Notes password</h1>
          <p className="text-sm text-muted-foreground">
            This password is only for Notes — it must be different from your login password.
          </p>
        </div>

        <form onSubmit={handleSetup} className="space-y-4 rounded-2xl border bg-card/70 p-6">
          <div className="space-y-2">
            <Label htmlFor="notes-password">Notes password</Label>
            <Input
              id="notes-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a Notes-only password"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes-password-confirm">Confirm Notes password</Label>
            <Input
              id="notes-password-confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat Notes password"
              className="h-11"
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Lock className="size-4" />
                Save & unlock Notes
              </>
            )}
          </Button>
        </form>
      </div>
    );
  }

  if (mode === "locked") {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col justify-center space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Lock className="size-5 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Notes are locked</h1>
          <p className="text-sm text-muted-foreground">
            Enter your Notes password (not your login password) to open confidential notes.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4 rounded-2xl border bg-card/70 p-6">
          <div className="space-y-2">
            <Label htmlFor="notes-password">Notes password</Label>
            <Input
              id="notes-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your Notes password"
              className="h-11"
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Unlocking…
              </>
            ) : (
              <>
                <Unlock className="size-4" />
                Unlock Notes
              </>
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setChanging((value) => !value);
            resetFields();
          }}
        >
          Change Notes password
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void handleLock()}>
          <Lock className="size-3.5" />
          Lock notes
        </Button>
      </div>

      {changing && (
        <form
          onSubmit={handleChangePassword}
          className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card/70 p-5"
        >
          <div className="space-y-2">
            <Label htmlFor="notes-current">Current Notes password</Label>
            <Input
              id="notes-current"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes-new">New Notes password</Label>
            <Input
              id="notes-new"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes-new-confirm">Confirm new Notes password</Label>
            <Input
              id="notes-new-confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11"
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Update Notes password
          </Button>
        </form>
      )}

      {children}
    </div>
  );
}
