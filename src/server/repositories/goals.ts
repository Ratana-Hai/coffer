import "server-only";
import { Prisma } from "@prisma/client";
import { decimalToMinor, minorToDecimalString } from "@/lib/finance/money";
import type { Goal } from "@/features/goals/types";
import { prisma } from "@/server/db";

type GoalRow = Omit<Goal, "pct">;

function mapGoal(row: { id: string; name: string; target: Prisma.Decimal; saved: Prisma.Decimal }): GoalRow {
  return {
    id: row.id,
    name: row.name,
    target: decimalToMinor(row.target.toString()),
    saved: decimalToMinor(row.saved.toString()),
  };
}

export async function findGoals(userId: string): Promise<GoalRow[]> {
  const rows = await prisma.goal.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  return rows.map(mapGoal);
}

export async function createGoal(userId: string, data: { name: string; targetMinor: number }) {
  return prisma.goal.create({
    data: {
      userId,
      name: data.name,
      target: new Prisma.Decimal(minorToDecimalString(data.targetMinor)),
      saved: new Prisma.Decimal("0"),
    },
  });
}

export async function deleteGoal(userId: string, goalId: string) {
  const result = await prisma.goal.deleteMany({ where: { id: goalId, userId } });
  return result.count === 1;
}

/** R4 — `saved` is an atomic SQL increment, never read-modify-write, and the
 * transfer transaction lands in the same database transaction (spec 06 option
 * 2). A non-existent goal leaves nothing behind. */
export async function addFunds(
  userId: string,
  data: { goalId: string; amountMinor: number },
) {
  return prisma.$transaction(async (tx) => {
    const goal = await tx.goal.findFirst({ where: { id: data.goalId, userId } });
    if (!goal) return null;

    await tx.goal.update({
      where: { id: goal.id },
      data: { saved: { increment: new Prisma.Decimal(minorToDecimalString(data.amountMinor)) } },
    });

    await tx.transaction.create({
      data: {
        userId,
        date: new Date(),
        desc: `Transfer to — ${goal.name}`,
        amount: new Prisma.Decimal(minorToDecimalString(data.amountMinor)),
        type: "expense",
        category: "savings",
        goalId: goal.id,
      },
    });

    return goal;
  });
}
