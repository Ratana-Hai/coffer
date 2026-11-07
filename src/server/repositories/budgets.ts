import "server-only";
import { Prisma } from "@prisma/client";
import { minorToDecimalString } from "@/lib/finance/money";
import { prisma } from "@/server/db";

function atDatabaseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export async function findBudgets(userId: string) {
  return prisma.budget.findMany({ where: { userId } });
}

export async function findMonthExpenses(userId: string, monthStart: string, monthEnd: string) {
  return prisma.transaction.groupBy({
    by: ["category"],
    where: {
      userId,
      type: "expense",
      date: { gte: atDatabaseDate(monthStart), lt: atDatabaseDate(monthEnd) },
    },
    _sum: { amount: true },
  });
}

export async function upsertBudget(userId: string, categoryKey: string, monthlyLimitMinor: number) {
  const monthlyLimit = new Prisma.Decimal(minorToDecimalString(monthlyLimitMinor));
  return prisma.budget.upsert({
    where: { userId_categoryKey: { userId, categoryKey } },
    update: { monthlyLimit },
    create: { userId, categoryKey, monthlyLimit },
  });
}

export async function deleteBudget(userId: string, categoryKey: string) {
  const result = await prisma.budget.deleteMany({ where: { userId, categoryKey } });
  return result.count === 1;
}
