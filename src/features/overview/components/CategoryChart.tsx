"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CurrencyFormat } from "@/lib/finance/currency";
import { fmtCompact, fmtMoney } from "@/lib/finance/money";
import type { OverviewCategory } from "@/features/overview/types";

export function CategoryChart({
  categories,
  total,
  currency,
}: {
  categories: OverviewCategory[];
  total: number;
  currency: CurrencyFormat;
}) {
  if (categories.length === 0) {
    return (
      <p className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-line px-4 text-center text-sm text-muted">
        No expenses this month yet.
      </p>
    );
  }

  return (
    <div className="grid min-w-0 items-center gap-2 sm:grid-cols-[minmax(12rem,0.9fr)_minmax(0,1.1fr)]">
      <div
        className="relative h-56 min-w-0"
        role="img"
        aria-label="This month's expenses by category"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              dataKey="total"
              innerRadius="60%"
              outerRadius="84%"
              nameKey="label"
              paddingAngle={2}
              stroke="none"
            >
              {categories.map((category) => (
                <Cell key={category.key} fill={`var(--category-${category.slot})`} />
              ))}
            </Pie>
            <Tooltip
              content={(props) => {
                const category = props.payload?.[0]?.payload as OverviewCategory | undefined;
                if (!props.active || !category) return null;
                return (
                  <div className="rounded-xl border border-line bg-panel px-3 py-2 text-sm shadow-xl">
                    <p className="font-medium">{category.label}</p>
                    <p className="mt-0.5 text-muted tabular-nums">
                      {fmtMoney(category.total, currency)}
                    </p>
                  </div>
                );
              }}
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[0.65rem] tracking-[0.14em] text-muted uppercase">Spent</span>
          <span
            className="max-w-[8rem] truncate text-base font-semibold tabular-nums"
            title={fmtMoney(total, currency)}
          >
            {fmtCompact(total, currency)}
          </span>
        </div>
      </div>
      <ul className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-2">
        {categories.map((category) => (
          <li key={category.key} className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: `var(--category-${category.slot})` }}
            />
            <span className="min-w-0 flex-1 truncate text-xs text-muted" title={category.label}>
              {category.label}
            </span>
            <span
              className="shrink-0 text-xs font-medium tabular-nums"
              title={fmtMoney(category.total, currency)}
            >
              {fmtCompact(category.total, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
