import "server-only";
import { Prisma } from "@prisma/client";
import { decimalToMinor, minorToDecimalString } from "@/lib/finance/money";
import type { Loan } from "@/features/loans/types";
import { prisma } from "@/server/db";

function atDatabaseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

type LoanRow = Prisma.LoanGetPayload<{ include: { transactions: true } }>;

const paymentOrder: Prisma.TransactionOrderByWithRelationInput[] = [
  { date: "asc" },
  { id: "asc" },
];

function mapLoan(row: LoanRow): Loan {
  return {
    id: row.id,
    name: row.name,
    principal: decimalToMinor(row.principal.toString()),
    rate: Number(row.rate.toString()),
    termMonths: row.termMonths,
    startDate: row.startDate.toISOString().slice(0, 10),
    payments: row.transactions.map((payment) => ({
      id: payment.id,
      date: payment.date.toISOString().slice(0, 10),
      amount: decimalToMinor(payment.amount.toString()),
    })),
  };
}

export async function findLoans(userId: string): Promise<Loan[]> {
  const rows = await prisma.loan.findMany({
    where: { userId },
    include: { transactions: { where: { userId }, orderBy: paymentOrder } },
    orderBy: [{ startDate: "asc" }, { id: "asc" }],
  });
  return rows.map(mapLoan);
}

export async function findLoanById(userId: string, loanId: string): Promise<Loan | null> {
  const row = await prisma.loan.findFirst({
    where: { id: loanId, userId },
    include: { transactions: { where: { userId }, orderBy: paymentOrder } },
  });
  return row ? mapLoan(row) : null;
}

export async function createLoan(
  userId: string,
  data: {
    name: string;
    principalMinor: number;
    rate: number;
    termMonths: number;
    startDate: string;
  },
) {
  return prisma.loan.create({
    data: {
      userId,
      name: data.name,
      principal: new Prisma.Decimal(minorToDecimalString(data.principalMinor)),
      rate: new Prisma.Decimal(data.rate),
      termMonths: data.termMonths,
      startDate: atDatabaseDate(data.startDate),
    },
  });
}

/** R9 — deleting a loan relies on the schema's `onDelete: SetNull` to keep its
 * payment transactions in the ledger with `loanId` nulled. */
export async function deleteLoan(userId: string, loanId: string) {
  const result = await prisma.loan.deleteMany({ where: { id: loanId, userId } });
  return result.count === 1;
}

/** R6 — the payment transaction and the loan lookup share one database
 * transaction, so a failure leaves neither behind. */
export async function recordPayment(
  userId: string,
  data: { loanId: string; date: string; amountMinor: number },
) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findFirst({ where: { id: data.loanId, userId } });
    if (!loan) return null;
    return tx.transaction.create({
      data: {
        userId,
        date: atDatabaseDate(data.date),
        desc: `Loan payment — ${loan.name}`,
        amount: new Prisma.Decimal(minorToDecimalString(data.amountMinor)),
        type: "expense",
        category: "loan",
        loanId: loan.id,
      },
    });
  });
}
