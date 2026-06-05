"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createApplication } from "@/lib/career/api-client";
import type { JobApplicationDetail, JobApplicationSummary } from "@/modules/career/types";

interface CreateApplicationDialogProps {
  onCreated: (application: JobApplicationDetail) => void;
}

const statusOptions: JobApplicationSummary["status"][] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

export function CreateApplicationDialog({ onCreated }: CreateApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<JobApplicationSummary["status"]>("WISHLIST");
  const [jobUrl, setJobUrl] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setCompany("");
    setRole("");
    setStatus("WISHLIST");
    setJobUrl("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!company.trim() || !role.trim()) return;

    setLoading(true);
    try {
      const { application } = await createApplication({
        company: company.trim(),
        role: role.trim(),
        status,
        jobUrl: jobUrl.trim() || null,
      });
      onCreated(application);
      setOpen(false);
      resetForm();
      toast.success("Application added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add application");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="size-4" />
          Add application
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create application</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="application-company">Company</Label>
            <Input
              id="application-company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Acme Corp"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="application-role">Role</Label>
            <Input
              id="application-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Frontend Engineer"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as JobApplicationSummary["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.toLowerCase().replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="application-url">Job URL (optional)</Label>
            <Input
              id="application-url"
              type="url"
              value={jobUrl}
              onChange={(event) => setJobUrl(event.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Save application
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
