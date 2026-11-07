import type { Minor } from "@/lib/finance/money";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string;
  desc: string;
  amount: Minor;
  type: TransactionType;
  category: string | null;
  loanId: string | null;
}

export interface TransactionPage {
  items: Transaction[];
  nextCursor: string | null;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  month?: string;
}
