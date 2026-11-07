import "server-only";
import { cache } from "react";
import { currencyFormat } from "@/lib/finance/currency";
import type { CurrencyFormat } from "@/lib/finance/currency";
import { requireUser } from "@/server/auth/session";
import { findPreference } from "@/server/repositories/preferences";
import { findPage } from "@/server/repositories/transactions";
import type { Transaction, TransactionFilters } from "./types";

export const getCurrencyFormat = cache(async (): Promise<CurrencyFormat> => {
  const user = await requireUser();
  const preference = await findPreference(user.id);
  return currencyFormat(
    preference?.currencyCode,
    preference?.customSymbol,
    preference?.decimals,
    preference?.position,
  );
});

export const getTransactions = cache(
  async (args: { cursor?: string | null; limit: number } & TransactionFilters) => {
    const user = await requireUser();
    return findPage(user.id, args);
  },
);

export const getRecentTransactions = cache(async (limit = 5): Promise<Transaction[]> => {
  const user = await requireUser();
  const page = await findPage(user.id, { limit });
  return page.items;
});
