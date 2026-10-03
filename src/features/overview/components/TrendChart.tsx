"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CurrencyFormat } from "@/lib/finance/currency";
import { fmtCompact, fmtMoney } from "@/lib/finance/money";
import type { MonthBucket } from "@/lib/finance/overview";

export function TrendChart({
  trend,
  currency,
}: {
  trend: MonthBucket[];
  currency: CurrencyFormat;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2 rounded-full bg-[var(--chart-income)]" />
          Income
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2 rounded-full bg-[var(--chart-expense)]" />
          Expenses
        </span>
      </div>
      <div
        className="h-56 min-w-0"
        role="img"
        aria-label="Income and expenses for the last six months"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend} margin={{ top: 8, right: 0, bottom: 0, left: -14 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "var(--muted)", fontSize: 10 }}
              tickFormatter={(value) => fmtCompact(Number(value), currency)}
              tickLine={false}
              width={62}
            />
            <Tooltip
              content={(props) => {
                const month = props.payload?.[0]?.payload as MonthBucket | undefined;
                if (!props.active || !month) return null;
                return (
                  <div className="rounded-xl border border-line bg-panel px-3 py-2 text-sm shadow-xl">
                    <p className="mb-1 font-medium">{month.label}</p>
                    <p className="text-positive tabular-nums">
                      Income · {fmtMoney(month.income, currency)}
                    </p>
                    <p className="text-negative tabular-nums">
                      Expenses · {fmtMoney(month.expense, currency)}
                    </p>
                  </div>
                );
              }}
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
            />
            <Bar
              dataKey="income"
              fill="var(--chart-income)"
              maxBarSize={24}
              radius={[5, 5, 0, 0]}
            />
            <Bar
              dataKey="expense"
              fill="var(--chart-expense)"
              maxBarSize={24}
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
