import "server-only";
import { decimalToMinor } from "@/lib/finance/money";
import {
  createLoan as insertLoan,
  deleteLoan as removeLoan,
  recordPayment as insertPayment,
} from "@/server/repositories/loans";
import type { LoanInput, PaymentInput } from "@/features/loans/schema";

export async function createLoan(userId: string, input: LoanInput) {
  return insertLoan(userId, {
    name: input.name.trim(),
    principalMinor: decimalToMinor(String(input.principal)),
    rate: input.rate,
    termMonths: input.termMonths,
    startDate: input.startDate,
  });
}

export async function recordPayment(userId: string, input: PaymentInput) {
  return insertPayment(userId, {
    loanId: input.loanId,
    date: input.date,
    amountMinor: decimalToMinor(String(input.amount)),
  });
}

export async function deleteLoan(userId: string, loanId: string) {
  return removeLoan(userId, loanId);
}
