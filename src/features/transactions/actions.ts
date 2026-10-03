"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { deleteTransaction as removeTransaction } from "@/server/services/transactions";

export interface DeleteTransactionState {
  ok: boolean;
  message?: string;
}

export async function deleteTransaction(
  _previous: DeleteTransactionState,
  formData: FormData,
): Promise<DeleteTransactionState> {
  const user = await requireUser();
  const transactionId = formData.get("transactionId");
  const parsedId = z.string().uuid().safeParse(transactionId);
  if (!parsedId.success) {
    return { ok: false, message: "Transaction could not be found" };
  }

  const deleted = await removeTransaction(user.id, parsedId.data);
  if (!deleted) return { ok: false, message: "Transaction could not be found" };

  revalidatePath("/transactions");
  revalidatePath("/overview");
  revalidatePath("/budgets");
  revalidatePath("/loans");
  return { ok: true };
}
