"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/server/auth/session";
import { findPage } from "@/server/repositories/transactions";
import {
  createTransaction as insertTransaction,
  deleteTransaction as removeTransaction,
} from "@/server/services/transactions";
import { cursorSchema, transactionFiltersSchema, transactionSchema } from "./schema";
import type { TransactionPage } from "./types";

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
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createTransaction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await insertTransaction(user.id, parsed.data);
  } catch {
    return { ok: false, message: "Could not add transaction" };
  }

  revalidatePath("/transactions");
  revalidatePath("/overview");
  if (parsed.data.type === "expense") revalidatePath("/budgets");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function loadMoreTransactions(cursor: string, filters: unknown): Promise<TransactionPage> {
  const user = await requireUser();
  const parsedCursor = cursorSchema.safeParse(cursor);
  if (!parsedCursor.success) return { items: [], nextCursor: null };
  const parsedFilters = transactionFiltersSchema.safeParse(filters);
  if (!parsedFilters.success) return { items: [], nextCursor: null };
  return findPage(user.id, { cursor: parsedCursor.data, limit: 50, ...parsedFilters.data });
}
