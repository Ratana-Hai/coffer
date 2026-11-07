import { describe, expect, it } from "vitest";
import {
  accentCssVariables,
  contrastRatio,
  deriveAccentTokens,
  hexToRgb,
  pickAccentInk,
} from "@/lib/theme";

describe("accent derivation", () => {
  it("measures contrast ratios against the WCAG formula", () => {
    expect(contrastRatio(hexToRgb("#000000"), hexToRgb("#ffffff"))).toBeCloseTo(21, 0);
    expect(contrastRatio(hexToRgb("#ffffff"), hexToRgb("#ffffff"))).toBeCloseTo(1, 5);
  });

  it("picks text-on-accent by measured contrast, not luminance", () => {
    // White text on #2563eb clears 5.2:1 while near-black only reaches 3.8:1.
    expect(pickAccentInk(hexToRgb("#2563eb"))).toBe("#ffffff");
    // A light accent flips the winner.
    expect(pickAccentInk(hexToRgb("#fbbf24"))).toBe("#0a0c10");
  });

  it("clears 4.5:1 for text on a mid-tone accent in both modes (R11)", () => {
    const accent = "#7a8b3c";
    for (const background of ["#111512", "#ffffff"]) {
      const tokens = deriveAccentTokens(accent, background);
      expect(contrastRatio(hexToRgb(tokens.ink), hexToRgb(tokens.accent))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the accent-as-text readable on its background in both modes (R11)", () => {
    const dark = accentCssVariables("#7a8b3c", "dark");
    expect(contrastRatio(hexToRgb(dark["--accent-text"]), hexToRgb("#111512"))).toBeGreaterThanOrEqual(4.5);
    const light = accentCssVariables("#7a8b3c", "light");
    expect(contrastRatio(hexToRgb(light["--accent-text"]), hexToRgb("#ffffff"))).toBeGreaterThanOrEqual(4.5);
  });
});
