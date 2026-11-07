import type { AmortizationRow } from "@/lib/finance/amortization";
import type { CurrencyFormat } from "@/lib/finance/currency";
import { fmtMoney } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

export function AmortSchedule({
  schedule,
  currency,
  paidCount,
}: {
  schedule: AmortizationRow[];
  currency: CurrencyFormat;
  paidCount: number;
}) {
  if (schedule.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
        This loan never amortizes at the current rate.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-line bg-panel">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-5 py-3 font-medium">#</th>
            <th className="px-5 py-3 font-medium">Payment</th>
            <th className="px-5 py-3 font-medium">Interest</th>
            <th className="px-5 py-3 font-medium">Principal</th>
            <th className="px-5 py-3 font-medium">Balance left</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => (
            <tr
              key={row.i}
              className={cn(
                "border-b border-line/70 last:border-0",
                row.i <= paidCount ? "text-muted" : "text-foreground",
              )}
            >
              <td className="px-5 py-2.5 font-mono tabular-nums">
                {row.i <= paidCount ? "✓" : row.i}
              </td>
              <td className="px-5 py-2.5 tabular-nums">{fmtMoney(row.payment, currency)}</td>
              <td className="px-5 py-2.5 tabular-nums">{fmtMoney(row.interest, currency)}</td>
              <td className="px-5 py-2.5 tabular-nums">{fmtMoney(row.principal, currency)}</td>
              <td className="px-5 py-2.5 tabular-nums">{fmtMoney(row.balance, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
