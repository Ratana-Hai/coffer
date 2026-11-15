"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/server/auth/session";
import * as service from "@/server/services/goals";
import { addFundsSchema, goalSchema } from "./schema";

export async function createGoal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = goalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await service.createGoal(user.id, parsed.data);
  } catch {
    return { ok: false, message: "Could not create goal" };
  }

  revalidatePath("/goals");
  revalidatePath("/overview");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addFunds(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = addFundsSchema.safeParse({
    goalId: formData.get("goalId"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const goal = await service.addFunds(user.id, parsed.data);
    if (!goal) return { ok: false, message: "Goal could not be found" };
  } catch {
    return { ok: false, message: "Could not add funds" };
  }

  revalidatePath("/goals");
  revalidatePath("/overview");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteGoal(goalId: string): Promise<ActionState> {
  const user = await requireUser();
  const parsedId = z.string().uuid().safeParse(goalId);
  if (!parsedId.success) return { ok: false, message: "Goal could not be found" };

  const deleted = await service.deleteGoal(user.id, parsedId.data);
  if (!deleted) return { ok: false, message: "Goal could not be found" };

  revalidatePath("/goals");
  revalidatePath("/overview");
  revalidatePath("/", "layout");
  return { ok: true };
}
