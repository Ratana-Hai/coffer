"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/server/auth/session";
import * as service from "@/server/services/loans";
import { loanSchema, paymentSchema } from "./schema";

export async function createLoan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = loanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await service.createLoan(user.id, parsed.data);
  } catch {
    return { ok: false, message: "Could not create loan" };
  }

  revalidatePath("/loans");
  revalidatePath("/overview");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function recordPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = paymentSchema.safeParse({
    loanId: formData.get("loanId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const created = await service.recordPayment(user.id, parsed.data);
    if (!created) return { ok: false, message: "Loan could not be found" };
  } catch {
    return { ok: false, message: "Could not record payment" };
  }

  revalidatePath("/loans");
  revalidatePath("/transactions");
  revalidatePath("/overview");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteLoan(loanId: string): Promise<ActionState> {
  const user = await requireUser();
  const parsedId = z.string().uuid().safeParse(loanId);
  if (!parsedId.success) return { ok: false, message: "Loan could not be found" };

  const deleted = await service.deleteLoan(user.id, parsedId.data);
  if (!deleted) return { ok: false, message: "Loan could not be found" };

  revalidatePath("/loans");
  revalidatePath("/transactions");
  revalidatePath("/overview");
  revalidatePath("/", "layout");
  return { ok: true };
}
