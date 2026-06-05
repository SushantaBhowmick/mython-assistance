import type {
  FinanceCategorySummary,
  FinanceMonthSummary,
  TransactionSummary,
} from "@/modules/finance/types";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : "Request failed",
    );
  }
  return data as T;
}

export async function listTransactions(params?: {
  month?: string;
  type?: "EXPENSE" | "INCOME";
}) {
  const search = new URLSearchParams();
  if (params?.month) search.set("month", params.month);
  if (params?.type) search.set("type", params.type);
  const query = search.toString();
  const url = query ? `/api/finance/transactions?${query}` : "/api/finance/transactions";

  return parseJson<{ transactions: TransactionSummary[]; degraded?: boolean }>(
    await fetch(url, { cache: "no-store" }),
  );
}

export async function createTransaction(input: {
  type: "EXPENSE" | "INCOME";
  amount: string;
  categoryId?: string | null;
  description?: string | null;
  occurredAt: string;
}) {
  return parseJson<{ transaction: TransactionSummary }>(
    await fetch("/api/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateTransaction(
  id: string,
  input: Partial<{
    type: "EXPENSE" | "INCOME";
    amount: string;
    categoryId: string | null;
    description: string | null;
    occurredAt: string;
  }>,
) {
  return parseJson<{ transaction: TransactionSummary }>(
    await fetch(`/api/finance/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteTransaction(id: string) {
  return parseJson<{ ok: boolean }>(
    await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" }),
  );
}

export async function listCategories() {
  return parseJson<{ categories: FinanceCategorySummary[]; seeded?: boolean }>(
    await fetch("/api/finance/categories", { cache: "no-store" }),
  );
}

export async function createCategory(input: {
  name: string;
  type: "EXPENSE" | "INCOME";
  icon?: string | null;
}) {
  return parseJson<{ category: FinanceCategorySummary }>(
    await fetch("/api/finance/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function getFinanceSummary(month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return parseJson<{ summary: FinanceMonthSummary }>(
    await fetch(`/api/finance/summary${query}`, { cache: "no-store" }),
  );
}
