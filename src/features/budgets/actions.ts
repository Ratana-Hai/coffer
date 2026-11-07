"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { decimalToMinor } from "@/lib/finance/money";
import { requireUser } from "@/server/auth/session";
import * as service from "@/server/services/budgets";
import { budgetSchema } from "./schema";

export async function setBudget(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = budgetSchema.safeParse({
    categoryKey: formData.get("categoryKey"),
    monthlyLimit: formData.get("monthlyLimit"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { categoryKey, monthlyLimit } = parsed.data;
  try {
    if (monthlyLimit <= 0) {
      await service.clearBudget(user.id, categoryKey);
    } else {
      await service.setBudget(user.id, categoryKey, decimalToMinor(String(monthlyLimit)));
    }
  } catch {
    return { ok: false, message: "Could not save budget" };
  }

  revalidatePath("/budgets");
  revalidatePath("/overview");
  return { ok: true };
}
