import { describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  generateSecret,
  hotp,
  totpAt,
  verifyTotp,
} from "@/lib/totp";

const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // base32 of "12345678901234567890"

describe("base32", () => {
  it("round-trips bytes", () => {
    const secret = generateSecret(20);
    expect(base32Encode(base32Decode(secret))).toBe(secret);
  });

  it("encodes the RFC 6238 test secret", () => {
    expect(base32Encode(Buffer.from("12345678901234567890"))).toBe(RFC_SECRET);
  });
});

describe("totp (RFC 6238 Appendix B)", () => {
  it.each([
    [59_000, "94287082"],
    [1_111_111_109_000, "07081804"],
    [1_111_111_111_000, "14050471"],
    [1_234_567_890_000, "89005924"],
    [2_000_000_000_000, "69279037"],
  ])("matches the 8-digit SHA1 vector at T=%d", (timestamp, expected) => {
    expect(totpAt(RFC_SECRET, timestamp, 8, 30)).toBe(expected);
  });

  it("verifies the current window and neighbouring ±1 windows, rejecting ±2", () => {
    const now = 1_700_000_000_000;
    const current = totpAt(RFC_SECRET, now);
    expect(verifyTotp(RFC_SECRET, current, { timestamp: now })).toBe(true);
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, now + 30_000), { timestamp: now })).toBe(true);
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, now - 30_000), { timestamp: now })).toBe(true);
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, now + 60_000), { timestamp: now })).toBe(false);
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, now - 60_000), { timestamp: now })).toBe(false);
  });

  it("rejects malformed codes", () => {
    expect(verifyTotp(RFC_SECRET, "12345", { timestamp: 0 })).toBe(false);
    expect(verifyTotp(RFC_SECRET, "abcdef", { timestamp: 0 })).toBe(false);
  });

  it("produces six-digit zero-padded codes", () => {
    expect(hotp(RFC_SECRET, 0, 6)).toMatch(/^\d{6}$/);
  });
});
