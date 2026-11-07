import "server-only";
import { cache } from "react";
import type { CurrencyFormat } from "@/lib/finance/currency";
import { currencyFormat } from "@/lib/finance/currency";
import { amortSchedule, loanStatus, totalLoanDebt } from "@/lib/finance/amortization";
import type { Minor } from "@/lib/finance/money";
import { requireUser } from "@/server/auth/session";
import { findPreference } from "@/server/repositories/preferences";
import { findLoanById, findLoans } from "@/server/repositories/loans";
import type { LoanDetail, LoanWithStatus } from "./types";

export interface LoansData {
  loans: LoanWithStatus[];
  totalDebt: Minor;
  currency: CurrencyFormat;
}

function formatCurrency(preference: {
  currencyCode: string;
  customSymbol: string | null;
  decimals: number;
  position: string;
} | null): CurrencyFormat {
  return currencyFormat(
    preference?.currencyCode,
    preference?.customSymbol,
    preference?.decimals,
    preference?.position,
  );
}

export const getLoans = cache(async (): Promise<LoansData> => {
  const user = await requireUser();
  const [loans, preference] = await Promise.all([findLoans(user.id), findPreference(user.id)]);
  return {
    loans: loans.map((loan) => ({ ...loan, status: loanStatus(loan, loan.payments) })),
    totalDebt: totalLoanDebt(loans),
    currency: formatCurrency(preference),
  };
});

export const getLoan = cache(
  async (
    loanId: string,
  ): Promise<{ loan: LoanDetail; currency: CurrencyFormat } | null> => {
    const user = await requireUser();
    const [loan, preference] = await Promise.all([
      findLoanById(user.id, loanId),
      findPreference(user.id),
    ]);
    if (!loan) return null;
    return {
      loan: {
        ...loan,
        status: loanStatus(loan, loan.payments),
        schedule: amortSchedule(loan),
      },
      currency: formatCurrency(preference),
    };
  },
);

/** R10 — the single source for the debt figure, shared with the Overview tile. */
export const getTotalDebt = cache(async (): Promise<Minor> => {
  const user = await requireUser();
  const loans = await findLoans(user.id);
  return totalLoanDebt(loans);
});
