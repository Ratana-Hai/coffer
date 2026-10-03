import { TransactionRow } from "@/features/transactions/components/TransactionRow";
import type { OverviewData } from "@/features/overview/types";

export function RecentActivity({ overview }: { overview: OverviewData }) {
  return (
    <section className="flex min-h-[23.5rem] flex-col rounded-3xl border border-line bg-panel p-4 sm:min-h-[24.5rem] sm:p-6">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">
            Recent activity
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Your last 5 transactions</h2>
        </div>
      </div>
      {overview.recent.length ? (
        <ul className="min-w-0 flex-1">
          {overview.recent.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              currency={overview.currency}
            />
          ))}
        </ul>
      ) : (
        <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          Nothing logged yet.
        </p>
      )}
    </section>
  );
}
