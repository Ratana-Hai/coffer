import { describe, expect, it } from "vitest";
import { transactionSchema } from "@/features/transactions/schema";

const validExpense = {
  date: "2026-01-01",
  desc: "Groceries",
  amount: "12.34",
  type: "expense",
  category: "food",
};

describe("transactionSchema", () => {
  it("accepts a valid expense", () => {
    expect(transactionSchema.safeParse(validExpense).success).toBe(true);
  });

  it("accepts income without a category", () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      type: "income",
      category: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative amount (R2)", () => {
    const result = transactionSchema.safeParse({ ...validExpense, amount: "-5" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("amount");
  });

  it("rejects a zero amount", () => {
    expect(transactionSchema.safeParse({ ...validExpense, amount: "0" }).success).toBe(false);
  });

  it("requires a category for expenses", () => {
    const result = transactionSchema.safeParse({ ...validExpense, category: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("category");
  });

  it("rejects the loan category (R7)", () => {
    const result = transactionSchema.safeParse({ ...validExpense, category: "loan" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("category"))).toBe(true);
  });

  it("enforces the 120-character description limit", () => {
    const result = transactionSchema.safeParse({ ...validExpense, desc: "x".repeat(121) });
    expect(result.success).toBe(false);
  });
});
