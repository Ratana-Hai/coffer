"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/server/auth/session";
import * as service from "@/server/services/settings";
import { setCurrencySchema, settingsSchema } from "./schema";

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await service.saveSettings(user.id, parsed.data);
  } catch {
    return { ok: false, message: "Could not save settings" };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { ok: true };
}

/** R8 — immediate, not drafted. Called straight from the account menu. */
export async function setCurrency(code: string): Promise<ActionState> {
  const user = await requireUser();
  const parsed = setCurrencySchema.safeParse({ code });
  if (!parsed.success) return { ok: false, message: "Unknown currency" };

  try {
    await service.setCurrency(user.id, parsed.data.code);
  } catch {
    return { ok: false, message: "Could not change currency" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** R10 — immediate, outside the draft. The two-tap confirm lives in the card. */
export async function clearAllData(): Promise<ActionState> {
  const user = await requireUser();
  try {
    await service.clearAllData(user.id);
  } catch {
    return { ok: false, message: "Could not clear data" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
