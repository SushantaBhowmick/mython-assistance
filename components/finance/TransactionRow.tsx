"use client";

import { ArrowDownCircle, ArrowUpCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TransactionSummary } from "@/modules/finance/types";
import { cn } from "@/lib/utils";

interface TransactionRowProps {
  transaction: TransactionSummary;
  busy?: boolean;
  onDelete: (id: string) => void;
}

export function TransactionRow({ transaction, busy, onDelete }: TransactionRowProps) {
  const isIncome = transaction.type === "INCOME";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.description || transaction.categoryName || "Untitled transaction"}
        </p>
        <p className="text-xs text-muted-foreground">
          {transaction.categoryName || "Uncategorized"} · {new Date(transaction.occurredAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <p className={cn("text-sm font-semibold", isIncome ? "text-emerald-600" : "text-rose-600")}>
          {isIncome ? "+" : "-"}${transaction.amount}
        </p>
        {isIncome ? (
          <ArrowUpCircle className="size-4 text-emerald-600" />
        ) : (
          <ArrowDownCircle className="size-4 text-rose-600" />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          aria-label="Delete transaction"
          onClick={() => onDelete(transaction.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
