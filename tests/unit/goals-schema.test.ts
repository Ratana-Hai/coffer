import { describe, expect, it } from "vitest";
import { addFundsSchema, goalSchema } from "@/features/goals/schema";

const validGoal = { name: "Emergency fund", target: "5000" };

describe("goalSchema", () => {
  it("accepts a valid goal", () => {
    expect(goalSchema.safeParse(validGoal).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(goalSchema.safeParse({ ...validGoal, name: "" }).success).toBe(false);
  });

  it("rejects a non-positive target", () => {
    expect(goalSchema.safeParse({ ...validGoal, target: "0" }).success).toBe(false);
  });
});

describe("addFundsSchema", () => {
  const valid = { goalId: "00000000-0000-4000-8000-000000000000", amount: "500" };

  it("accepts a valid amount", () => {
    expect(addFundsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    expect(addFundsSchema.safeParse({ ...valid, amount: "0" }).success).toBe(false);
    expect(addFundsSchema.safeParse({ ...valid, amount: "-5" }).success).toBe(false);
  });
});
