import type {
  FinanceCategorySummary,
  FinanceMonthSummary,
  TransactionSummary,
} from "@/modules/finance/types";
import type { FinanceCategory, Prisma, Transaction } from "@prisma/client";

type TransactionWithCategory = Transaction & {
  category?: Pick<FinanceCategory, "id" | "name" | "type"> | null;
};

export const transactionInclude = {
  category: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
} satisfies Prisma.TransactionInclude;

export function serializeCategory(category: FinanceCategory): FinanceCategorySummary {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    type: category.type,
  };
}

export function serializeTransaction(transaction: TransactionWithCategory): TransactionSummary {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount.toString(),
    categoryId: transaction.categoryId,
    categoryName: transaction.category?.name ?? null,
    description: transaction.description,
    occurredAt: transaction.occurredAt.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
  };
}

export function monthRange(month?: string) {
  const now = new Date();
  const [year, monthIndex] = month
    ? month.split("-").map((part) => Number(part))
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];

  const start = new Date(Date.UTC(year, monthIndex - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const normalized = `${year}-${String(monthIndex).padStart(2, "0")}`;

  return { start, end, normalized };
}

function decimalToNumber(value: Prisma.Decimal | null): number {
  return Number(value?.toString() ?? "0");
}

export function serializeMonthSummary(input: {
  month: string;
  income: Prisma.Decimal | null;
  expense: Prisma.Decimal | null;
  transactionCount: number;
}): FinanceMonthSummary {
  const incomeNumber = decimalToNumber(input.income);
  const expenseNumber = decimalToNumber(input.expense);
  const net = incomeNumber - expenseNumber;

  return {
    month: input.month,
    income: incomeNumber.toFixed(2),
    expense: expenseNumber.toFixed(2),
    net: net.toFixed(2),
    transactionCount: input.transactionCount,
  };
}
