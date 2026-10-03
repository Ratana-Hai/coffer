import { describe, expect, it } from "vitest";
import {
  amortSchedule,
  loanStatus,
  scheduledPayment,
  totalLoanDebt,
} from "@/lib/finance/amortization";
import { categoryFor } from "@/lib/finance/categories";
import { currencyFormat } from "@/lib/finance/currency";
import { buildTrendBuckets, goalPercent, overviewPeriod } from "@/lib/finance/overview";
import { decimalToMinor, fmtCompact, fmtMoney } from "@/lib/finance/money";

describe("money", () => {
  it("converts database decimals to minor units without binary float math", () => {
    expect(decimalToMinor("1234.56")).toBe(123456);
    expect(decimalToMinor("-1.005")).toBe(-101);
  });

  it("formats KHR as a whole-number suffix", () => {
    expect(fmtMoney(123456, currencyFormat("KHR"))).toBe("1,235៛");
    expect(fmtCompact(1234, currencyFormat("KHR"))).toBe("12៛");
    expect(fmtCompact(1234567, currencyFormat("KHR"))).toBe("12.3K៛");
  });
});

describe("loan amortization", () => {
  it("handles zero-interest loans and textbook amortization", () => {
    expect(scheduledPayment({ principal: 10000, rate: 0, termMonths: 10 })).toBe(1000);
    expect(scheduledPayment({ principal: 10000000, rate: 5, termMonths: 360 })).toBe(53682);
  });

  it("closes the schedule and accounts for overpayment and shortfall", () => {
    const schedule = amortSchedule({
      principal: 10000000,
      rate: 5,
      termMonths: 360,
    });
    expect(schedule.at(-1)?.balance).toBe(0);

    const loan = { principal: 100000, rate: 12, termMonths: 12 };
    const shortfall = loanStatus(loan, [{ id: "1", date: "2026-01-01", amount: 500 }]);
    expect(shortfall.balance).toBe(100500);
    expect(shortfall.shortfall).toBe(true);

    const overpayment = loanStatus(loan, [{ id: "1", date: "2026-01-01", amount: 200000 }]);
    expect(overpayment.balance).toBe(0);
    expect(overpayment.cleared).toBe(true);
  });

  it("orders payments by date and id before folding the balance", () => {
    const loan = { principal: 100000, rate: 12, termMonths: 12 };
    const status = loanStatus(loan, [
      { id: "b", date: "2026-02-01", amount: 1100 },
      { id: "a", date: "2026-01-01", amount: 1100 },
    ]);
    expect(status.balance).toBe(99799);
    expect(status.last).toBe("2026-02-01");
  });

  it("sums debt through the shared loan status calculation", () => {
    expect(
      totalLoanDebt([
        { principal: 50000, rate: 0, termMonths: 10, payments: [] },
        {
          principal: 100000,
          rate: 0,
          termMonths: 10,
          payments: [{ id: "p1", date: "2026-01-01", amount: 25000 }],
        },
      ]),
    ).toBe(125000);
  });
});

describe("overview derived values", () => {
  it("returns six trend buckets including empty months across a year boundary", () => {
    const buckets = buildTrendBuckets(new Date(2026, 0, 15), [
      { key: "2025-08", type: "income", total: 5000 },
    ]);
    expect(buckets.map(({ key }) => key)).toEqual([
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
    expect(buckets[0].income).toBe(5000);
    expect(buckets[1].expense).toBe(0);
  });

  it("uses the user's timezone for calendar month boundaries", () => {
    const now = new Date("2026-09-01T00:30:00.000Z");
    expect(overviewPeriod(now, "America/Los_Angeles")).toMatchObject({
      currentStart: "2026-08-01",
      trendStart: "2026-03-01",
      nextStart: "2026-09-01",
      label: "August 2026",
    });
  });

  it("guards a zero goal target and uses stable category slots", () => {
    expect(goalPercent(0, 0)).toBe(0);
    expect(goalPercent(250, 1000)).toBe(25);
    expect(categoryFor("loan").slot).toBe(7);
    expect(categoryFor("unknown").key).toBe("other");
  });
});
