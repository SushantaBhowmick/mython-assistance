"use client";

import { useCallback, useEffect, useState } from "react";

import { AddTransactionDialog } from "@/components/finance/AddTransactionDialog";
import { FinanceOverviewSkeleton } from "@/components/finance/FinanceSkeletons";
import { TransactionRow } from "@/components/finance/TransactionRow";
import { EmptyState } from "@/components/music/EmptyState";
import { Input } from "@/components/ui/input";
import { deleteTransaction, getFinanceSummary, listTransactions } from "@/lib/finance/api-client";
import type { FinanceMonthSummary, TransactionSummary } from "@/modules/finance/types";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function FinanceOverview() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<FinanceMonthSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResult, transactionsResult] = await Promise.all([
        getFinanceSummary(month),
        listTransactions({ month }),
      ]);
      setSummary(summaryResult.summary);
      setTransactions(transactionsResult.transactions);
      setDegraded(Boolean(transactionsResult.degraded));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load finance data");
      setSummary(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this transaction?")) return;
    setBusyId(id);
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((item) => item.id !== id));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete transaction");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value || currentMonth())}
          className="max-w-[12rem]"
        />
        <AddTransactionDialog onCreated={() => void load()} />
      </div>

      {degraded && !loading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          Database was temporarily unavailable.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <FinanceOverviewSkeleton />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="mt-1 text-lg font-semibold text-emerald-600">${summary?.income ?? "0.00"}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Expense</p>
              <p className="mt-1 text-lg font-semibold text-rose-600">${summary?.expense ?? "0.00"}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Net</p>
              <p className="mt-1 text-lg font-semibold">${summary?.net ?? "0.00"}</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <EmptyState
              title="No transactions"
              description="Add your first income or expense to start tracking finances."
            />
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  busy={busyId === transaction.id}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
