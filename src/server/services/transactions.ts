import "server-only";
import { deleteTransaction as removeTransaction } from "@/server/repositories/transactions";

export async function deleteTransaction(userId: string, transactionId: string) {
  return removeTransaction(userId, transactionId);
}
