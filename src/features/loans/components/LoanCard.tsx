import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurrencyFormat } from "@/lib/finance/currency";
import { fmtMoney } from "@/lib/finance/money";
import type { LoanWithStatus } from "../types";
import { DeleteLoanButton } from "./DeleteLoanButton";
import { RecordPaymentForm } from "./RecordPaymentForm";

export function LoanCard({
  loan,
  currency,
}: {
  loan: LoanWithStatus;
  currency: CurrencyFormat;
}) {
  const { status } = loan;

  const figures = [
    { label: "Scheduled payment", value: fmtMoney(status.payment, currency) },
    { label: "Balance", value: fmtMoney(status.balance, currency) },
    { label: "Paid to date", value: fmtMoney(status.paid, currency) },
    { label: "Interest paid", value: fmtMoney(status.interestPaid, currency) },
    { label: "Payments", value: String(status.count) },
    { label: "Last payment", value: status.last ? status.last.slice(5) : "—" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{loan.name}</CardTitle>
            <CardDescription>First payment {loan.startDate}</CardDescription>
          </div>
          <DeleteLoanButton loanId={loan.id} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pb-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {figures.map((figure) => (
            <div key={figure.label}>
              <p className="text-xs text-muted">{figure.label}</p>
              <p className="mt-0.5 truncate text-sm font-semibold tabular-nums" title={figure.value}>
                {figure.value}
              </p>
            </div>
          ))}
        </div>

        {status.shortfall ? (
          <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
            A payment didn&apos;t cover the interest for its period — the balance grew.
          </p>
        ) : null}

        {status.cleared ? (
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-good/15 px-3 py-1 text-sm font-medium text-good">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-good" />
            Cleared
          </p>
        ) : (
          <RecordPaymentForm loanId={loan.id} />
        )}

        <Link
          href={`/loans/${loan.id}`}
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-accent-text transition-colors hover:text-accent"
        >
          View schedule
          <ChevronRight aria-hidden="true" size={16} />
        </Link>
      </CardContent>
    </Card>
  );
}
