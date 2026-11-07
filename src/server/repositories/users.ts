import "server-only";
import { prisma } from "@/server/db";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: { name: string; email: string }) {
  return prisma.user.create({ data });
}

export async function markOnboarded(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { onboarded: true } });
}

export async function updateProfile(userId: string, data: { name?: string; email?: string }) {
  return prisma.user.update({ where: { id: userId }, data });
}

export interface ActivityCounts {
  transactions: number;
  budgets: number;
  goals: number;
  loans: number;
}

export async function userActivityCounts(userId: string): Promise<ActivityCounts> {
  const [transactions, budgets, goals, loans] = await prisma.$transaction([
    prisma.transaction.count({ where: { userId } }),
    prisma.budget.count({ where: { userId } }),
    prisma.goal.count({ where: { userId } }),
    prisma.loan.count({ where: { userId } }),
  ]);
  return { transactions, budgets, goals, loans };
}
