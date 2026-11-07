import "server-only";
import { decimalToMinor } from "@/lib/finance/money";
import {
  deleteTransaction as removeTransaction,
  insertTransaction,
} from "@/server/repositories/transactions";
import type { TransactionInput } from "@/features/transactions/schema";

export async function deleteTransaction(userId: string, transactionId: string) {
  return removeTransaction(userId, transactionId);
}

export async function createTransaction(userId: string, input: TransactionInput) {
  return insertTransaction(userId, {
    date: input.date,
    desc: input.desc,
    amount: decimalToMinor(String(input.amount)),
    type: input.type,
    category: input.type === "expense" ? (input.category ?? null) : null,
  });
}
