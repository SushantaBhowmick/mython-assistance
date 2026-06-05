export type TransactionType = "EXPENSE" | "INCOME";

export interface FinanceCategorySummary {
  id: string;
  name: string;
  icon: string | null;
  type: TransactionType;
}

export interface TransactionSummary {
  id: string;
  type: TransactionType;
  amount: string;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface FinanceMonthSummary {
  month: string;
  income: string;
  expense: string;
  net: string;
  transactionCount: number;
}
