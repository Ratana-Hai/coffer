import { ViewHeader } from "@/components/layout/ViewHeader";
import { AddLoanPanel } from "@/features/loans/components/AddLoanPanel";
import { LoanCard } from "@/features/loans/components/LoanCard";
import { getLoans } from "@/features/loans/queries";
import { fmtMoney } from "@/lib/finance/money";

export default async function LoansPage() {
  const data = await getLoans();
  const header = data.loans.length
    ? `${data.loans.length} ${data.loans.length === 1 ? "loan" : "loans"} · ${fmtMoney(data.totalDebt, data.currency)} outstanding`
    : "No loans tracked";

  return (
    <>
      <ViewHeader title="Loans" summary={header} eyebrow="Personal ledger" />
      <AddLoanPanel currency={data.currency} />
      <div className="space-y-4">
        {data.loans.length ? (
          data.loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} currency={data.currency} />
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
            No loans tracked — add your first one above.
          </p>
        )}
      </div>
    </>
  );
}
