import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const TTL_MS = 5 * 60 * 1000;

function sign(payload: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Issues a short-lived, single-purpose token used to start the session right after sign-up. */
export function issueSignUpToken(userId: string): string {
  const expires = Date.now() + TTL_MS;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the userId when the token is valid and unexpired, otherwise null. */
export function verifySignUpToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresStr, signature] = parts;
  if (!safeEqual(sign(`${userId}.${expiresStr}`), signature)) return null;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || expires < Date.now()) return null;
  return userId;
}
