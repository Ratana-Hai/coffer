import "server-only";
import { Prisma } from "@prisma/client";
import { totalLoanDebt } from "@/lib/finance/amortization";
import { categoryFor } from "@/lib/finance/categories";
import { currencyFormat } from "@/lib/finance/currency";
import { buildTrendBuckets, overviewPeriod } from "@/lib/finance/overview";
import { decimalToMinor } from "@/lib/finance/money";
import type { OverviewData, OverviewCategory } from "@/features/overview/types";
import { prisma } from "@/server/db";

type TransactionType = "income" | "expense";
type TypeTotal = {
  type: TransactionType;
  _sum?: { amount?: Prisma.Decimal | null };
};

function atDatabaseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function sumFor(groups: TypeTotal[], type: TransactionType): number {
  const amount = groups.find((group) => group.type === type)?._sum?.amount;
  return amount ? decimalToMinor(amount.toString()) : 0;
}

export async function findOverview(userId: string, timeZone: string): Promise<OverviewData> {
  const now = new Date();
  const period = overviewPeriod(now, timeZone);

  // Dev-only: return empty data so the shell renders without a database.
  if (process.env.NODE_ENV === "development" && process.env.COFFER_DEV_PREVIEW === "1") {
    return {
      balance: 0,
      monthIncome: 0,
      monthExpense: 0,
      monthLabel: period.label,
      debt: 0,
      loanCount: 0,
      goalCount: 0,
      goalSaved: 0,
      goalTarget: 0,
      byCategory: [],
      trend: buildTrendBuckets(now, [], timeZone),
      recent: [],
      currency: currencyFormat("USD"),
    };
  }
  const currentStart = atDatabaseDate(period.currentStart);
  const nextStart = atDatabaseDate(period.nextStart);
  const [
    balanceGroups,
    monthGroups,
    categoryGroups,
    trendRows,
    loans,
    goalTotals,
    recent,
    preference,
  ] = await prisma.$transaction(
    [
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId },
        _sum: { amount: true },
        orderBy: { type: "asc" },
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId, date: { gte: currentStart, lt: nextStart } },
        _sum: { amount: true },
        orderBy: { type: "asc" },
      }),
      prisma.transaction.groupBy({
        by: ["category"],
        where: {
          userId,
          type: "expense",
          date: { gte: currentStart, lt: nextStart },
        },
        _sum: { amount: true },
        orderBy: { category: "asc" },
      }),
      prisma.$queryRaw<Array<{ key: string; type: TransactionType; total: string }>>`
          SELECT to_char(date_trunc('month', "date"), 'YYYY-MM') AS "key",
                 "type"::text AS "type",
                 SUM("amount")::text AS "total"
          FROM "transactions"
          WHERE "user_id" = ${userId}::uuid
            AND "date" >= ${period.trendStart}::date
            AND "date" < ${period.nextStart}::date
          GROUP BY 1, 2
        `,
      prisma.loan.findMany({
        where: { userId },
        include: {
          transactions: {
            where: { userId },
            orderBy: [{ date: "asc" }, { id: "asc" }],
          },
        },
      }),
      prisma.goal.aggregate({
        where: { userId },
        _sum: { saved: true, target: true },
        _count: true,
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: [{ date: "desc" }, { id: "desc" }],
        take: 5,
      }),
      prisma.preference.findUnique({ where: { userId } }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );

  const categoryTotals = new Map<string, OverviewCategory>();
  for (const row of categoryGroups) {
    if (!row._sum?.amount) continue;
    const definition = categoryFor(row.category);
    const total = decimalToMinor(row._sum.amount.toString());
    const existing = categoryTotals.get(definition.key);
    categoryTotals.set(definition.key, {
      ...definition,
      total: total + (existing?.total ?? 0),
    });
  }

  const debt = totalLoanDebt(
    loans.map((loan) => ({
      principal: decimalToMinor(loan.principal.toString()),
      rate: Number(loan.rate.toString()),
      termMonths: loan.termMonths,
      payments: loan.transactions.map((payment) => ({
        id: payment.id,
        date: payment.date.toISOString().slice(0, 10),
        amount: decimalToMinor(payment.amount.toString()),
      })),
    })),
  );

  const goalSaved = goalTotals._sum.saved ? decimalToMinor(goalTotals._sum.saved.toString()) : 0;
  const goalTarget = goalTotals._sum.target ? decimalToMinor(goalTotals._sum.target.toString()) : 0;

  return {
    balance: sumFor(balanceGroups, "income") - sumFor(balanceGroups, "expense"),
    monthIncome: sumFor(monthGroups, "income"),
    monthExpense: sumFor(monthGroups, "expense"),
    monthLabel: period.label,
    debt,
    loanCount: loans.length,
    goalCount: goalTotals._count,
    goalSaved,
    goalTarget,
    byCategory: [...categoryTotals.values()]
      .filter((category) => category.total > 0)
      .sort((a, b) => a.slot - b.slot),
    trend: buildTrendBuckets(
      now,
      trendRows.map((row) => ({
        key: row.key,
        type: row.type,
        total: decimalToMinor(row.total),
      })),
      timeZone,
    ),
    recent: recent.map((transaction) => ({
      id: transaction.id,
      date: transaction.date.toISOString().slice(0, 10),
      desc: transaction.desc,
      amount: decimalToMinor(transaction.amount.toString()),
      type: transaction.type,
      category: transaction.category,
      loanId: transaction.loanId,
    })),
    currency: currencyFormat(
      preference?.currencyCode,
      preference?.customSymbol,
      preference?.decimals,
      preference?.position,
    ),
  };
}
