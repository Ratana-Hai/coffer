import "server-only";
import { cache } from "react";
import type { CurrencyFormat } from "@/lib/finance/currency";
import { currencyFormat } from "@/lib/finance/currency";
import type { Minor } from "@/lib/finance/money";
import { goalProgressPercent } from "@/lib/finance/overview";
import { requireUser } from "@/server/auth/session";
import { findGoals } from "@/server/repositories/goals";
import { findPreference } from "@/server/repositories/preferences";
import type { Goal } from "./types";

export interface GoalsData {
  goals: Goal[];
  currency: CurrencyFormat;
}

export interface GoalTotals {
  saved: Minor;
  target: Minor;
  pct: number;
}

export const getGoals = cache(async (): Promise<GoalsData> => {
  const user = await requireUser();
  const [rows, preference] = await Promise.all([findGoals(user.id), findPreference(user.id)]);
  return {
    goals: rows.map((row) => ({
      ...row,
      pct: goalProgressPercent(row.saved, row.target),
    })),
    currency: currencyFormat(
      preference?.currencyCode,
      preference?.customSymbol,
      preference?.decimals,
      preference?.position,
    ),
  };
});

/** Shared with the Overview savings tile (spec 06). */
export const getGoalTotals = cache(async (): Promise<GoalTotals> => {
  const user = await requireUser();
  const rows = await findGoals(user.id);
  const saved = rows.reduce((total, goal) => total + goal.saved, 0);
  const target = rows.reduce((total, goal) => total + goal.target, 0);
  return { saved, target, pct: goalProgressPercent(saved, target) };
});
