import { categoryFor } from "@/lib/finance/categories";
import { fmtMoney } from "@/lib/finance/money";
import type { CurrencyFormat } from "@/lib/finance/currency";
import type { RecentTransaction } from "@/features/overview/types";
import { DeleteTransactionButton } from "./DeleteTransactionButton";

export function TransactionRow({
  transaction,
  currency,
}: {
  transaction: RecentTransaction;
  currency: CurrencyFormat;
}) {
  const label = transaction.type === "income" ? "Income" : categoryFor(transaction.category).label;
  const amount = fmtMoney(transaction.amount, currency);

  return (
    <li className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_auto_2.75rem] items-center gap-1 border-b border-line/70 py-1 last:border-0">
      <time
        className="font-mono text-[0.68rem] text-muted tabular-nums"
        dateTime={transaction.date}
      >
        {transaction.date.slice(5)}
      </time>
      <div className="min-w-0 py-2">
        <p className="truncate text-sm font-medium" title={transaction.desc}>
          {transaction.desc}
        </p>
        <p className="truncate text-xs text-muted">{label}</p>
      </div>
      <p
        className={`text-right text-sm font-medium whitespace-nowrap tabular-nums ${transaction.type === "income" ? "text-positive" : "text-negative"}`}
      >
        {transaction.type === "income" ? "+" : "−"}
        {amount}
      </p>
      <DeleteTransactionButton
        transactionId={transaction.id}
        isLoanPayment={transaction.loanId !== null}
      />
    </li>
  );
}
