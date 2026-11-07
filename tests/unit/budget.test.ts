import { describe, expect, it } from "vitest";
import { budgetPercent, budgetStatus } from "@/lib/finance/budget";

describe("budget status bands", () => {
  it("puts the boundaries on the inclusive side (R4)", () => {
    expect(budgetStatus(0.699)).toBe("good");
    expect(budgetStatus(0.7)).toBe("warning");
    expect(budgetStatus(0.999)).toBe("warning");
    expect(budgetStatus(1)).toBe("critical");
  });

  it("keeps the pill percentage uncapped (R5)", () => {
    expect(budgetPercent(14000, 10000)).toBe(140);
    expect(budgetPercent(0, 10000)).toBe(0);
  });

  it("guards a zero or missing limit", () => {
    expect(budgetPercent(10000, 0)).toBe(0);
    expect(budgetPercent(10000, -5)).toBe(0);
  });
});
