"use client";

import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
import { createTransaction, listCategories } from "@/lib/finance/api-client";
import type { FinanceCategorySummary, TransactionSummary } from "@/modules/finance/types";

interface AddTransactionDialogProps {
  onCreated: (transaction: TransactionSummary) => void;
}

export function AddTransactionDialog({ onCreated }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState<string>("none");
  const [categories, setCategories] = useState<FinanceCategorySummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    listCategories()
      .then((result) => setCategories(result.categories))
      .catch(() => undefined);
  }, [open]);

  function resetForm() {
    setType("EXPENSE");
    setAmount("");
    setDescription("");
    setOccurredAt(new Date().toISOString().slice(0, 10));
    setCategoryId("none");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!amount.trim()) return;

    setLoading(true);
    try {
      const { transaction } = await createTransaction({
        type,
        amount: amount.trim(),
        categoryId: categoryId === "none" ? null : categoryId,
        description: description.trim() || null,
        occurredAt: new Date(`${occurredAt}T12:00:00`).toISOString(),
      });
      onCreated(transaction);
      setOpen(false);
      resetForm();
      toast.success("Transaction added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  }

  const filteredCategories = categories.filter((category) => category.type === type);

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
          Add transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as "EXPENSE" | "INCOME")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-amount">Amount</Label>
            <Input
              id="transaction-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-description">Description</Label>
            <Input
              id="transaction-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Save transaction
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
