import { notFound } from "next/navigation";
import { ViewHeader } from "@/components/layout/ViewHeader";
import { AmortSchedule } from "@/features/loans/components/AmortSchedule";
import { getLoan } from "@/features/loans/queries";
import { fmtMoney } from "@/lib/finance/money";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ loanId: string }>;
}) {
  const { loanId } = await params;
  const detail = await getLoan(loanId);
  if (!detail) notFound();

  return (
    <>
      <ViewHeader
        title={detail.loan.name}
        summary={`${detail.loan.status.count} payments · ${fmtMoney(detail.loan.status.balance, detail.currency)} left`}
        eyebrow="Loan"
      />
      <AmortSchedule
        schedule={detail.loan.schedule}
        currency={detail.currency}
        paidCount={detail.loan.status.count}
      />
    </>
  );
}
