import type { CurrencyFormat } from "@/lib/finance/currency";
import type { MonthBucket } from "@/lib/finance/overview";
import type { Minor } from "@/lib/finance/money";
import type { Transaction } from "@/features/transactions/types";

export interface OverviewCategory {
  key: string;
  label: string;
  slot: number;
  total: Minor;
}

export type RecentTransaction = Transaction;

export interface OverviewData {
  balance: Minor;
  monthIncome: Minor;
  monthExpense: Minor;
  monthLabel: string;
  debt: Minor;
  loanCount: number;
  goalCount: number;
  goalSaved: Minor;
  goalTarget: Minor;
  byCategory: OverviewCategory[];
  trend: MonthBucket[];
  recent: RecentTransaction[];
  currency: CurrencyFormat;
}
