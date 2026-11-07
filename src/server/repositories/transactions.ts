import "server-only";
import { Prisma } from "@prisma/client";
import { decimalToMinor, minorToDecimalString } from "@/lib/finance/money";
import type { Transaction, TransactionFilters, TransactionType } from "@/features/transactions/types";
import { prisma } from "@/server/db";

function atDatabaseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

type TransactionRow = {
  id: string;
  date: Date;
  desc: string;
  amount: Prisma.Decimal;
  type: TransactionType;
  category: string | null;
  loanId: string | null;
};

function mapRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    desc: row.desc,
    amount: decimalToMinor(row.amount.toString()),
    type: row.type,
    category: row.category,
    loanId: row.loanId,
  };
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const result = await prisma.transaction.deleteMany({
    where: { id: transactionId, userId },
  });
  return result.count === 1;
}

export async function findAllTransactions(userId: string) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });
}

export async function insertTransaction(
  userId: string,
  data: {
    date: string;
    desc: string;
    amount: number;
    type: TransactionType;
    category: string | null;
  },
): Promise<Transaction> {
  const row = await prisma.transaction.create({
    data: {
      userId,
      date: atDatabaseDate(data.date),
      desc: data.desc,
      amount: new Prisma.Decimal(minorToDecimalString(data.amount)),
      type: data.type,
      category: data.category,
    },
  });
  return mapRow(row);
}

export interface FindPageArgs extends TransactionFilters {
  cursor?: string | null;
  limit: number;
}

/** Cursor is `date DESC, id DESC` (R1) — the sort key is the cursor key, so
 * pagination and sort cannot disagree (R9). */
export async function findPage(
  userId: string,
  { cursor, limit, type, category, month }: FindPageArgs,
): Promise<{ items: Transaction[]; nextCursor: string | null }> {
  const where: Prisma.TransactionWhereInput = { userId };

  if (type) where.type = type;
  if (category) where.category = category;
  if (month) {
    const [year, monthNumber] = month.split("-").map(Number);
    where.date = {
      gte: atDatabaseDate(`${year}-${String(monthNumber).padStart(2, "0")}-01`),
      lt: atDatabaseDate(
        `${monthNumber === 12 ? year + 1 : year}-${String(monthNumber === 12 ? 1 : monthNumber + 1).padStart(2, "0")}-01`,
      ),
    };
  }
  if (cursor) {
    const [date, id] = cursor.split("::");
    if (date && id) {
      where.OR = [{ date: { lt: atDatabaseDate(date) } }, { date: atDatabaseDate(date), id: { lt: id } }];
    }
  }

  const rows = await prisma.transaction.findMany({
    where,
    orderBy: [{ date: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(mapRow);
  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? `${last.date}::${last.id}` : null;

  return { items, nextCursor };
}
