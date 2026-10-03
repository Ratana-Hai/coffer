import { goalPercent } from "@/lib/finance/overview";
import { fmtCompact, fmtMoney } from "@/lib/finance/money";
import { getOverview } from "@/features/overview/queries";

export async function StatGrid() {
  const overview = await getOverview();
  const goalValue = `${goalPercent(overview.goalSaved, overview.goalTarget)}%`;
  const goalExact = `${fmtMoney(overview.goalSaved, overview.currency)} of ${fmtMoney(overview.goalTarget, overview.currency)}`;
  const loanFoot =
    overview.loanCount === 0
      ? "No loans yet"
      : `${overview.loanCount} ${overview.loanCount === 1 ? "loan" : "loans"}`;
  const stats = [
    {
      label: "Net balance",
      value: fmtCompact(overview.balance, overview.currency),
      exact: fmtMoney(overview.balance, overview.currency),
      foot: "All time",
      tone: overview.balance >= 0 ? "text-positive" : "text-negative",
    },
    {
      label: "Income this month",
      value: fmtCompact(overview.monthIncome, overview.currency),
      exact: fmtMoney(overview.monthIncome, overview.currency),
      foot: overview.monthLabel,
      tone: "text-positive",
    },
    {
      label: "Expenses this month",
      value: fmtCompact(overview.monthExpense, overview.currency),
      exact: fmtMoney(overview.monthExpense, overview.currency),
      foot: overview.monthLabel,
      tone: overview.monthExpense > 0 ? "text-negative" : "text-foreground",
    },
    {
      label: "Outstanding debt",
      value: fmtCompact(overview.debt, overview.currency),
      exact: fmtMoney(overview.debt, overview.currency),
      foot: loanFoot,
      tone: overview.debt > 0 ? "text-negative" : "text-foreground",
    },
    {
      label: "Toward savings goals",
      value: goalValue,
      exact: goalExact,
      foot:
        overview.goalCount === 0
          ? "No goals yet"
          : `${fmtMoney(overview.goalSaved, overview.currency)} of ${fmtMoney(overview.goalTarget, overview.currency)}`,
      tone: "text-foreground",
    },
  ];

  return (
    <section
      aria-label="Financial summary"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5"
    >
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="h-[6.875rem] min-w-0 rounded-2xl border border-line bg-panel px-3 py-3 sm:h-[6.375rem] sm:px-4 sm:py-4"
        >
          <h2 className="min-h-9 text-xs leading-4 text-muted sm:min-h-5">{stat.label}</h2>
          <p
            aria-label={`${stat.label}: ${stat.exact}`}
            className={`truncate text-lg font-semibold tracking-tight tabular-nums sm:text-xl ${stat.tone}`}
            title={stat.exact}
          >
            {stat.value}
          </p>
          <p className="mt-1 truncate text-[0.68rem] text-muted" title={stat.foot}>
            {stat.foot}
          </p>
        </article>
      ))}
    </section>
  );
}

export function StatGridSkeleton() {
  return (
    <section
      aria-label="Loading financial summary"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-[6.875rem] animate-pulse rounded-2xl border border-line bg-panel sm:h-[6.375rem]"
        />
      ))}
    </section>
  );
}
