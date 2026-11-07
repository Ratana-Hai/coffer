import "server-only";
import {
  deleteBudget as removeBudget,
  upsertBudget,
} from "@/server/repositories/budgets";

export async function setBudget(userId: string, categoryKey: string, monthlyLimitMinor: number) {
  return upsertBudget(userId, categoryKey, monthlyLimitMinor);
}

/** R3 — clearing a limit (blank or zero) deletes the row rather than storing a
 * zero. */
export async function clearBudget(userId: string, categoryKey: string) {
  return removeBudget(userId, categoryKey);
}
