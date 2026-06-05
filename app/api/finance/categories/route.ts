import { Prisma } from "@prisma/client";

import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createCategorySchema } from "@/lib/finance/schemas";
import { serializeCategory } from "@/lib/finance/serialize";
import { prisma, safePrismaRead, withPrismaRetry } from "@/lib/prisma/client";

const defaultCategories: Array<{
  name: string;
  type: "EXPENSE" | "INCOME";
  icon: string;
}> = [
  { name: "Food", type: "EXPENSE", icon: "utensils" },
  { name: "Transport", type: "EXPENSE", icon: "car" },
  { name: "Housing", type: "EXPENSE", icon: "home" },
  { name: "Utilities", type: "EXPENSE", icon: "bolt" },
  { name: "Health", type: "EXPENSE", icon: "heart-pulse" },
  { name: "Salary", type: "INCOME", icon: "briefcase" },
  { name: "Freelance", type: "INCOME", icon: "laptop" },
  { name: "Other", type: "INCOME", icon: "wallet" },
];

async function seedDefaultCategories(userId: string) {
  await withPrismaRetry(() =>
    prisma.financeCategory.createMany({
      data: defaultCategories.map((category) => ({
        userId,
        name: category.name,
        type: category.type,
        icon: category.icon,
      })),
      skipDuplicates: true,
    }),
  );
}

export async function GET() {
  try {
    const userId = await getUserId();

    let seeded = false;
    const { data: categories, degraded } = await safePrismaRead(
      () =>
        prisma.financeCategory.findMany({
          where: { userId },
          orderBy: [{ type: "asc" }, { name: "asc" }],
        }),
      [],
      "finance/categories/list",
    );

    let finalCategories = categories;
    if (categories.length === 0) {
      await seedDefaultCategories(userId);
      seeded = true;
      const seededRead = await safePrismaRead(
        () =>
          prisma.financeCategory.findMany({
            where: { userId },
            orderBy: [{ type: "asc" }, { name: "asc" }],
          }),
        [],
        "finance/categories/list-seeded",
      );
      finalCategories = seededRead.data;
    }

    return jsonOk({
      categories: finalCategories.map(serializeCategory),
      seeded: seeded || undefined,
      degraded: degraded || undefined,
    });
  } catch (error) {
    return handleRouteError(error, "[finance/categories/get]");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid category data", 400);
    }

    const userId = await getUserId();
    const category = await withPrismaRetry(() =>
      prisma.financeCategory.create({
        data: {
          userId,
          name: parsed.data.name,
          type: parsed.data.type,
          icon: parsed.data.icon ?? null,
        },
      }),
    );

    return jsonOk({ category: serializeCategory(category) }, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("Category with this name and type already exists", 409);
    }
    return handleRouteError(error, "[finance/categories/post]");
  }
}
