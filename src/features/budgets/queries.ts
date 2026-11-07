import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { CurrencyFormat } from "@/lib/finance/currency";
import { currencyFormat } from "@/lib/finance/currency";
import type { BudgetStatus } from "@/lib/finance/budget";
import { budgetPercent, budgetStatus } from "@/lib/finance/budget";
import { MANUAL_CATEGORIES } from "@/lib/finance/categories";
import type { Minor } from "@/lib/finance/money";
import { decimalToMinor } from "@/lib/finance/money";
import { overviewPeriod } from "@/lib/finance/overview";
import { requireUser } from "@/server/auth/session";
import { findBudgets, findMonthExpenses } from "@/server/repositories/budgets";
import { findPreference } from "@/server/repositories/preferences";

export interface BudgetCategory {
  categoryKey: string;
  label: string;
  slot: number;
  limit: Minor | null;
  spent: Minor;
  pct: number;
  status: BudgetStatus | null;
}

export interface BudgetsData {
  monthLabel: string;
  categories: BudgetCategory[];
  currency: CurrencyFormat;
}

export const getBudgets = cache(async (): Promise<BudgetsData> => {
  const user = await requireUser();
  const cookieStore = await cookies();
  const timeZone = cookieStore.get("coffer-timezone")?.value;
  const fallback = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let period;
  try {
    if (timeZone) new Intl.DateTimeFormat("en-US", { timeZone }).format();
    period = overviewPeriod(new Date(), timeZone || fallback);
  } catch {
    period = overviewPeriod(new Date(), fallback);
  }

  const [budgets, expenseGroups, preference] = await Promise.all([
    findBudgets(user.id),
    findMonthExpenses(user.id, period.currentStart, period.nextStart),
    findPreference(user.id),
  ]);

  const limitByCategory = new Map(
    budgets.map((budget) => [budget.categoryKey, decimalToMinor(budget.monthlyLimit.toString())]),
  );
  const spentByCategory = new Map<string, number>();
  for (const group of expenseGroups) {
    const amount = group._sum?.amount;
    if (group.category && amount) {
      spentByCategory.set(group.category, decimalToMinor(amount.toString()));
    }
  }

  const categories: BudgetCategory[] = MANUAL_CATEGORIES.map((category) => {
    const limit = limitByCategory.get(category.key) ?? null;
    const spent = spentByCategory.get(category.key) ?? 0;
    const hasLimit = limit !== null && limit > 0;
    return {
      categoryKey: category.key,
      label: category.label,
      slot: category.slot,
      limit,
      spent,
      pct: hasLimit ? budgetPercent(spent, limit) : 0,
      status: hasLimit ? budgetStatus(spent / limit) : null,
    };
  });

  return {
    monthLabel: period.label,
    categories,
    currency: currencyFormat(
      preference?.currencyCode,
      preference?.customSymbol,
      preference?.decimals,
      preference?.position,
    ),
  };
});
