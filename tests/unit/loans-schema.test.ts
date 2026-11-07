import { describe, expect, it } from "vitest";
import { loanSchema, paymentSchema } from "@/features/loans/schema";

const validLoan = {
  name: "Car loan",
  principal: "10000",
  rate: "5",
  termMonths: "60",
  startDate: "2026-01-01",
};

describe("loanSchema", () => {
  it("accepts a valid loan, including a 0% rate (R1)", () => {
    expect(loanSchema.safeParse(validLoan).success).toBe(true);
    expect(loanSchema.safeParse({ ...validLoan, rate: "0" }).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(loanSchema.safeParse({ ...validLoan, name: "" }).success).toBe(false);
  });

  it("rejects a non-positive principal", () => {
    expect(loanSchema.safeParse({ ...validLoan, principal: "0" }).success).toBe(false);
    expect(loanSchema.safeParse({ ...validLoan, principal: "-100" }).success).toBe(false);
  });

  it("rejects a rate above 100", () => {
    expect(loanSchema.safeParse({ ...validLoan, rate: "101" }).success).toBe(false);
  });

  it("rejects a zero or fractional term", () => {
    expect(loanSchema.safeParse({ ...validLoan, termMonths: "0" }).success).toBe(false);
    expect(loanSchema.safeParse({ ...validLoan, termMonths: "60.5" }).success).toBe(false);
  });
});

describe("paymentSchema", () => {
  it("accepts a valid payment", () => {
    expect(
      paymentSchema.safeParse({
        loanId: "00000000-0000-4000-8000-000000000000",
        amount: "250",
        date: "2026-01-01",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    const base = { loanId: "00000000-0000-4000-8000-000000000000", date: "2026-01-01" };
    expect(paymentSchema.safeParse({ ...base, amount: "0" }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...base, amount: "-5" }).success).toBe(false);
  });

  it("rejects a non-uuid loan id", () => {
    expect(
      paymentSchema.safeParse({ loanId: "not-a-uuid", amount: "250", date: "2026-01-01" }).success,
    ).toBe(false);
  });
});
