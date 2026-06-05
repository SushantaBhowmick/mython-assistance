import { Prisma } from "@prisma/client";

import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createTransactionSchema, listTransactionsQuerySchema } from "@/lib/finance/schemas";
import { monthRange, serializeTransaction, transactionInclude } from "@/lib/finance/serialize";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const parsed = listTransactionsQuerySchema.safeParse({
      month: searchParams.get("month") ?? undefined,
      type: searchParams.get("type") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    const month = parsed.data.month ? monthRange(parsed.data.month) : null;
    const where = {
      userId,
      ...(parsed.data.type ? { type: parsed.data.type } : {}),
      ...(month
        ? {
            occurredAt: {
              gte: month.start,
              lt: month.end,
            },
          }
        : {}),
    };

    const { data: transactions, degraded } = await safePrismaRead(
      () =>
        prisma.transaction.findMany({
          where,
          include: transactionInclude,
          orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        }),
      [],
      "finance/transactions/list",
    );

    return jsonOk({
      transactions: transactions.map(serializeTransaction),
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[finance/transactions/get]");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid transaction data", 400);
    }

    const userId = await getUserId();
    if (parsed.data.categoryId) {
      const category = await prisma.financeCategory.findFirst({
        where: { id: parsed.data.categoryId, userId },
      });
      if (!category) return jsonError("Category not found", 404, "NOT_FOUND");
      if (category.type !== parsed.data.type) {
        return jsonError("Category type does not match transaction type", 400);
      }
    }

    const transaction = await withPrismaRetry(() =>
      prisma.transaction.create({
        data: {
          userId,
          type: parsed.data.type,
          amount: new Prisma.Decimal(parsed.data.amount),
          categoryId: parsed.data.categoryId ?? null,
          description: parsed.data.description ?? null,
          occurredAt: new Date(parsed.data.occurredAt),
        },
        include: transactionInclude,
      }),
    );

    return jsonOk({ transaction: serializeTransaction(transaction) }, 201);
  } catch (error) {
    return handleRouteError(error, "[finance/transactions/post]");
  }
}
