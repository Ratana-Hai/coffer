import type { Minor } from "./money";

export interface LoanTerms {
  principal: Minor;
  rate: number;
  termMonths: number;
}

export interface LoanPayment {
  id: string;
  date: string;
  amount: Minor;
}

export interface LoanStatus {
  payment: Minor;
  balance: Minor;
  paid: Minor;
  interestPaid: Minor;
  count: number;
  last: string | null;
  shortfall: boolean;
  cleared: boolean;
}

export interface AmortizationRow {
  i: number;
  payment: Minor;
  interest: Minor;
  principal: Minor;
  balance: Minor;
}

export interface LoanLedger extends LoanTerms {
  payments: LoanPayment[];
}

export function monthlyRate(loan: LoanTerms): number {
  return loan.rate / 100 / 12;
}

export function scheduledPayment(loan: LoanTerms): Minor {
  if (loan.termMonths <= 0) return 0;
  const rate = monthlyRate(loan);
  if (rate === 0) return Math.floor(loan.principal / loan.termMonths + 0.5);
  const payment = (loan.principal * rate) / (1 - (1 + rate) ** -loan.termMonths);
  return Math.floor(payment + 0.5);
}

export function loanStatus(loan: LoanTerms, payments: LoanPayment[]): LoanStatus {
  const ordered = [...payments].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const rate = monthlyRate(loan);
  let balance = loan.principal;
  let paid = 0;
  let interestPaid = 0;
  let shortfall = false;

  for (const payment of ordered) {
    const interestDue = Math.floor(balance * rate + 0.5);
    if (payment.amount <= interestDue) {
      interestPaid += payment.amount;
      balance += interestDue - payment.amount;
      shortfall = true;
    } else {
      interestPaid += interestDue;
      balance = Math.max(0, balance - (payment.amount - interestDue));
    }
    paid += payment.amount;
  }

  return {
    payment: scheduledPayment(loan),
    balance,
    paid,
    interestPaid,
    count: ordered.length,
    last: ordered.at(-1)?.date ?? null,
    shortfall,
    cleared: balance <= 0.5,
  };
}

export function totalLoanDebt(loans: LoanLedger[]): Minor {
  return loans.reduce((total, loan) => {
    return total + loanStatus(loan, loan.payments).balance;
  }, 0);
}

export function amortSchedule(loan: LoanTerms): AmortizationRow[] {
  const rate = monthlyRate(loan);
  const scheduled = scheduledPayment(loan);
  const rows: AmortizationRow[] = [];
  let balance = loan.principal;

  for (let i = 1; i <= loan.termMonths && balance > 0.5; i += 1) {
    const interest = Math.floor(balance * rate + 0.5);
    const payment =
      i === loan.termMonths ? balance + interest : Math.min(scheduled, balance + interest);
    const principal = Math.min(balance, payment - interest);
    if (principal <= 0) break;
    balance = Math.max(0, balance - principal);
    rows.push({ i, payment, interest, principal, balance });
  }
  return rows;
}
