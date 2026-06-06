import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log("Database connection OK:", rows);
} catch (error) {
  console.error("Database connection FAILED:", error.code ?? error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
