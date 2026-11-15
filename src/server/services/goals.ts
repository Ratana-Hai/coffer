import "server-only";
import { decimalToMinor } from "@/lib/finance/money";
import {
  addFunds as addGoalFunds,
  createGoal as insertGoal,
  deleteGoal as removeGoal,
} from "@/server/repositories/goals";
import type { AddFundsInput, GoalInput } from "@/features/goals/schema";

export async function createGoal(userId: string, input: GoalInput) {
  return insertGoal(userId, {
    name: input.name.trim(),
    targetMinor: decimalToMinor(String(input.target)),
  });
}

export async function addFunds(userId: string, input: AddFundsInput) {
  return addGoalFunds(userId, {
    goalId: input.goalId,
    amountMinor: decimalToMinor(String(input.amount)),
  });
}

export async function deleteGoal(userId: string, goalId: string) {
  return removeGoal(userId, goalId);
}
