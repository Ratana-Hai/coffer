import "server-only";
import { cooldownRemainingMs, DEFAULT_COOLDOWN } from "@/lib/cooldown";
import { qrToSvg } from "@/lib/qr";
import { generateSecret, otpAuthUri, verifyTotp as verifyTotpCode } from "@/lib/totp";
import { decryptSecret, encryptSecret } from "@/server/auth/encryption";
import * as authenticators from "@/server/repositories/authenticators";
import * as loginAttempts from "@/server/repositories/login-attempts";
import * as users from "@/server/repositories/users";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(data: { name: string; email: string }) {
  return users.createUser({ name: data.name.trim(), email: normalizeEmail(data.email) });
}

export async function findUserByEmail(email: string) {
  return users.findUserByEmail(normalizeEmail(email));
}

export async function hasConfirmedSecondFactor(userId: string): Promise<boolean> {
  const authenticator = await authenticators.findAuthenticatorByUserId(userId);
  return Boolean(authenticator?.confirmedAt);
}

/** R1 — a user is "new" only when not onboarded AND has no data AND no second factor. */
export async function isNewUser(userId: string): Promise<boolean> {
  const user = await users.findUserById(userId);
  if (!user || user.onboarded) return false;
  const { transactions, budgets, goals, loans } = await users.userActivityCounts(userId);
  if (transactions || budgets || goals || loans) return false;
  const authenticator = await authenticators.findAuthenticatorByUserId(userId);
  if (authenticator?.confirmedAt) return false;
  return true;
}

export async function markOnboarded(userId: string) {
  return users.markOnboarded(userId);
}

export async function beginTotpEnrollment(userId: string, label: string) {
  await authenticators.deleteUnconfirmedAuthenticator(userId);
  const secret = generateSecret();
  await authenticators.createAuthenticator({ userId, secret: encryptSecret(secret) });
  const uri = otpAuthUri(secret, { label });
  return { uri, qrSvg: qrToSvg(uri) };
}

export type TotpResult = { ok: true } | { ok: false; message: string };

export async function confirmTotpEnrollment(userId: string, code: string): Promise<TotpResult> {
  const authenticator = await authenticators.findAuthenticatorByUserId(userId);
  if (!authenticator || authenticator.confirmedAt) {
    return { ok: false, message: "No enrollment in progress" };
  }
  const secret = decryptSecret(authenticator.secret);
  if (!verifyTotpCode(secret, code, { digits: authenticator.digits, period: authenticator.period })) {
    return { ok: false, message: "Incorrect code" };
  }
  await authenticators.confirmAuthenticator(userId);
  return { ok: true };
}

export async function disableTotp(userId: string, code: string): Promise<TotpResult> {
  const authenticator = await authenticators.findAuthenticatorByUserId(userId);
  if (!authenticator || !authenticator.confirmedAt) {
    return { ok: false, message: "Second factor is not set up" };
  }
  const secret = decryptSecret(authenticator.secret);
  if (!verifyTotpCode(secret, code, { digits: authenticator.digits, period: authenticator.period })) {
    return { ok: false, message: "Incorrect code" };
  }
  await authenticators.deleteAuthenticators(userId);
  return { ok: true };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; message: string; cooldownRemainingMs?: number };

export async function verifySecondFactor(userId: string, code: string, ip: string): Promise<VerifyResult> {
  const authenticator = await authenticators.findAuthenticatorByUserId(userId);
  if (!authenticator || !authenticator.confirmedAt) {
    return { ok: false, message: "Second factor is not set up" };
  }

  const since = new Date(Date.now() - DEFAULT_COOLDOWN.windowMs);
  const { byIdentifier, byIp } = await loginAttempts.recentAttempts(userId, ip, since);
  const remaining = Math.max(
    cooldownRemainingMs(byIdentifier) ?? 0,
    cooldownRemainingMs(byIp) ?? 0,
  );
  if (remaining > 0) {
    return { ok: false, message: "Too many attempts", cooldownRemainingMs: remaining };
  }

  const secret = decryptSecret(authenticator.secret);
  if (!verifyTotpCode(secret, code, { digits: authenticator.digits, period: authenticator.period })) {
    await loginAttempts.recordLoginAttempt({ identifier: userId, ip });
    return { ok: false, message: "Incorrect code" };
  }

  return { ok: true };
}
