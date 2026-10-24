import { describe, expect, it } from "vitest";
import { cooldownRemainingMs } from "@/lib/cooldown";

describe("cooldownRemainingMs", () => {
  const now = 1_000_000;

  it("returns null when there are fewer than 5 recent attempts", () => {
    expect(cooldownRemainingMs([now - 1000, now - 2000, now - 3000, now - 4000], now)).toBeNull();
  });

  it("returns the remaining time once the 5th attempt triggers a cooldown", () => {
    const attempts = [now - 1000, now - 2000, now - 3000, now - 4000, now - 5000];
    expect(cooldownRemainingMs(attempts, now)).toBe(14_000);
  });

  it("ignores attempts older than the window", () => {
    const attempts = [now - 1000, now - 16_000, now - 17_000, now - 18_000, now - 19_000];
    expect(cooldownRemainingMs(attempts, now)).toBeNull();
  });

  it("returns null once the window has fully passed", () => {
    const attempts = [now - 20_000, now - 21_000, now - 22_000, now - 23_000, now - 24_000];
    expect(cooldownRemainingMs(attempts, now)).toBeNull();
  });
});
