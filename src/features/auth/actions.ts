"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { signIn, signOut, unstable_update } from "@/server/auth/config";
import { getSession, requireUser } from "@/server/auth/session";
import { issueSignUpToken } from "@/server/auth/signup-token";
import * as service from "@/server/services/auth";
import { signInSchema, signUpSchema, totpCodeSchema } from "./schema";

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await service.findUserByEmail(parsed.data.email);
  if (existing) {
    return { ok: false, fieldErrors: { email: ["Email is already registered"] } };
  }

  const user = await service.createUser(parsed.data);
  const url = await signIn("credentials", {
    token: issueSignUpToken(user.id),
    redirectTo: "/overview",
    redirect: false,
  });
  redirect(url);
}

export async function requestSignIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const next = parsed.data.next;
  const redirectTo =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/overview";

  const url = await signIn("email", {
    email: parsed.data.email,
    redirectTo,
    redirect: false,
  });
  redirect(url);
}

export async function skipOnboarding(): Promise<void> {
  const user = await requireUser();
  await service.markOnboarded(user.id);
  revalidatePath("/overview");
  revalidatePath("/");
}

export async function beginTotpEnrollment(): Promise<{ uri: string; qrSvg: string }> {
  const user = await requireUser();
  const label = user.email ?? user.name ?? "Coffer";
  return service.beginTotpEnrollment(user.id, label);
}

export async function confirmTotpEnrollment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = totpCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const result = await service.confirmTotpEnrollment(user.id, parsed.data.code);
  if (!result.ok) return { ok: false, message: result.message };
  return { ok: true };
}

export async function disableTotp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = totpCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const result = await service.disableTotp(user.id, parsed.data.code);
  if (!result.ok) return { ok: false, message: result.message };
  return { ok: true };
}

export interface VerifyState {
  ok: boolean;
  message?: string;
  cooldownRemainingMs?: number;
}

export async function verifyTotp(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.twoFactorVerified) redirect("/overview");

  const parsed = totpCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.flatten().fieldErrors.code?.[0] };
  }

  const ip = await clientIp();
  const result = await service.verifySecondFactor(session.user.id, parsed.data.code, ip);
  if (!result.ok) {
    return { ok: false, message: result.message, cooldownRemainingMs: result.cooldownRemainingMs };
  }

  await unstable_update({
    twoFactorVerified: true,
  } as unknown as Parameters<typeof unstable_update>[0]);
  redirect("/overview");
}

export async function lockNow(): Promise<void> {
  await signOut({ redirectTo: "/sign-in" });
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}
