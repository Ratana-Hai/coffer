import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const KEY_INFO = "coffer:totp-secret:v1";

function deriveKey(): Buffer {
  return createHmac("sha256", env.AUTH_SECRET).update(KEY_INFO).digest();
}

export function encryptSecret(plain: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64")).join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, ciphertextB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted authenticator secret");
  }
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
