import "server-only";
import { prisma } from "@/server/db";

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
