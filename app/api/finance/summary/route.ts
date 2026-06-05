import { TransactionType } from "@prisma/client";

import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { financeSummaryQuerySchema } from "@/lib/finance/schemas";
import { monthRange, serializeMonthSummary } from "@/lib/finance/serialize";
import { prisma, safePrismaRead } from "@/lib/prisma/client";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const parsed = financeSummaryQuerySchema.safeParse({
      month: searchParams.get("month") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const range = monthRange(parsed.data.month);
    const { data } = await safePrismaRead(
      async () => {
        const [incomeAggregate, expenseAggregate, transactionCount] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId,
              type: TransactionType.INCOME,
              occurredAt: { gte: range.start, lt: range.end },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId,
              type: TransactionType.EXPENSE,
              occurredAt: { gte: range.start, lt: range.end },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.count({
            where: {
              userId,
              occurredAt: { gte: range.start, lt: range.end },
            },
          }),
        ]);
        return {
          income: incomeAggregate._sum.amount,
          expense: expenseAggregate._sum.amount,
          transactionCount,
        };
      },
      {
        income: null,
        expense: null,
        transactionCount: 0,
      },
      "finance/summary/get",
    );

    return jsonOk({
      summary: serializeMonthSummary({
        month: range.normalized,
        income: data.income,
        expense: data.expense,
        transactionCount: data.transactionCount,
      }),
    });
  } catch (error) {
    return handleRouteError(error, "[finance/summary/get]");
  }
}
