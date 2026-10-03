import type { Minor } from "./money";

export interface MonthBucket {
  key: string;
  label: string;
  income: Minor;
  expense: Minor;
}

export interface TrendTotal {
  key: string;
  type: "income" | "expense";
  total: Minor;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function yearAndMonth(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
}

function monthDate(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

function dateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function overviewPeriod(now: Date, timeZone: string) {
  const { year, month } = yearAndMonth(now, timeZone);
  return {
    currentStart: dateKey(monthDate(year, month)),
    trendStart: dateKey(monthDate(year, month - 5)),
    nextStart: dateKey(monthDate(year, month + 1)),
    label: new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone,
    }).format(now),
  };
}

export function buildTrendBuckets(
  now: Date,
  totals: TrendTotal[],
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
): MonthBucket[] {
  const byMonth = new Map<string, { income: Minor; expense: Minor }>();
  for (const total of totals) {
    const bucket = byMonth.get(total.key) ?? { income: 0, expense: 0 };
    bucket[total.type] += total.total;
    byMonth.set(total.key, bucket);
  }

  const { year, month } = yearAndMonth(now, timeZone);
  return Array.from({ length: 6 }, (_, index) => {
    const date = monthDate(year, month - 5 + index);
    const key = monthKey(date);
    const values = byMonth.get(key) ?? { income: 0, expense: 0 };
    return {
      key,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "UTC",
      }).format(date),
      ...values,
    };
  });
}

export function goalPercent(saved: Minor, target: Minor): number {
  return target === 0 ? 0 : Math.round((saved / target) * 100);
}
