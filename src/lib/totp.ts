import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const TOTP_DIGITS = 6;
export const TOTP_PERIOD = 30;

export function generateSecret(length = 20): string {
  return base32Encode(randomBytes(length));
}

export function base32Encode(input: Uint8Array | Buffer): string {
  const bytes = Buffer.from(input);
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/, "").replace(/[\s-]+/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

export function hotp(secret: string, counter: number, digits = TOTP_DIGITS): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  const otp = binary % 10 ** digits;
  return otp.toString().padStart(digits, "0");
}

export function totpAt(
  secret: string,
  timestampMs: number,
  digits = TOTP_DIGITS,
  period = TOTP_PERIOD,
): string {
  const counter = Math.floor(timestampMs / 1000 / period);
  return hotp(secret, counter, digits);
}

export interface VerifyTotpOptions {
  timestamp?: number;
  digits?: number;
  period?: number;
  /** Accepted neighboring windows (R11: ±1). */
  window?: number;
}

export function verifyTotp(
  secret: string,
  code: string,
  { timestamp = Date.now(), digits = TOTP_DIGITS, period = TOTP_PERIOD, window = 1 }: VerifyTotpOptions = {},
): boolean {
  const candidate = code.replace(/[\s-]+/g, "");
  if (!new RegExp(`^\\d{${digits}}$`).test(candidate)) return false;

  const counter = Math.floor(timestamp / 1000 / period);
  for (let offset = -window; offset <= window; offset += 1) {
    if (safeEqual(hotp(secret, counter + offset, digits), candidate)) {
      return true;
    }
  }
  return false;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export interface OtpAuthUriOptions {
  label: string;
  issuer?: string;
  algorithm?: string;
  digits?: number;
  period?: number;
}

export function otpAuthUri(
  secret: string,
  { label, issuer = "Coffer", algorithm = "SHA1", digits = TOTP_DIGITS, period = TOTP_PERIOD }: OtpAuthUriOptions,
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm,
    digits: String(digits),
    period: String(period),
  });
  return `otpauth://totp/${issuer}:${encodeURIComponent(label)}?${params.toString()}`;
}
