import { Prisma } from "@prisma/client";

import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateTransactionSchema } from "@/lib/finance/schemas";
import { serializeTransaction, transactionInclude } from "@/lib/finance/serialize";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getOwnedTransaction(userId: string, id: string) {
  return prisma.transaction.findFirst({
    where: { id, userId },
    include: transactionInclude,
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const transaction = await getOwnedTransaction(userId, id);
    if (!transaction) return jsonError("Transaction not found", 404, "NOT_FOUND");

    return jsonOk({ transaction: serializeTransaction(transaction) });
  } catch (error) {
    return handleRouteError(error, "[finance/transactions/id/get]");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid transaction data", 400);
    }

    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return jsonError("Transaction not found", 404, "NOT_FOUND");

    const nextType = parsed.data.type ?? existing.type;
    const nextCategoryId =
      parsed.data.categoryId !== undefined ? parsed.data.categoryId : existing.categoryId;
    if (nextCategoryId) {
      const category = await prisma.financeCategory.findFirst({
        where: { id: nextCategoryId, userId },
      });
      if (!category) return jsonError("Category not found", 404, "NOT_FOUND");
      if (category.type !== nextType) {
        return jsonError("Category type does not match transaction type", 400);
      }
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.amount !== undefined) data.amount = new Prisma.Decimal(parsed.data.amount);
    if (parsed.data.occurredAt !== undefined) data.occurredAt = new Date(parsed.data.occurredAt);

    const transaction = await withPrismaRetry(() =>
      prisma.transaction.update({
        where: { id },
        data,
        include: transactionInclude,
      }),
    );

    return jsonOk({ transaction: serializeTransaction(transaction) });
  } catch (error) {
    return handleRouteError(error, "[finance/transactions/id/patch]");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return jsonError("Transaction not found", 404, "NOT_FOUND");

    await withPrismaRetry(() => prisma.transaction.delete({ where: { id } }));
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error, "[finance/transactions/id/delete]");
  }
}
