export type BudgetStatus = "good" | "warning" | "critical";

/** R4 — three status bands from the spent/limit ratio. The 0.7 boundary is
 * inclusive: 0.700 is "near limit", not "on track". */
export function budgetStatus(ratio: number): BudgetStatus {
  if (ratio >= 1) return "critical";
  if (ratio >= 0.7) return "warning";
  return "good";
}

/** The pill percentage is deliberately not capped — a 140% row reads "140%
 * used". Only the meter fill is capped (R5). */
export function budgetPercent(spent: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.round((spent / limit) * 100);
}
