import "server-only";
import { prisma } from "@/server/db";

/**
 * R10 — clear all data wipes the four ledger collections in one transaction and
 * leaves the account, profile, preferences and second factor untouched.
 */
export async function clearAllLedgerData(userId: string) {
  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.budget.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.loan.deleteMany({ where: { userId } }),
  ]);
}
