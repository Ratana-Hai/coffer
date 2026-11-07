import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewHeader } from "@/components/layout/ViewHeader";
import { TransactionList } from "@/features/transactions/components/TransactionList";
import { getCurrencyFormat, getTransactions } from "@/features/transactions/queries";
import type { TransactionFilters, TransactionType } from "@/features/transactions/types";

const LIMIT = 50;

type SearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseFilters(params: SearchParams): TransactionFilters {
  const filters: TransactionFilters = {};
  const type = single(params.type);
  if (type === "income" || type === "expense") filters.type = type as TransactionType;
  const category = single(params.category);
  if (category) filters.category = category;
  const month = single(params.month);
  if (month && /^\d{4}-\d{2}$/.test(month)) filters.month = month;
  return filters;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const page = await getTransactions({ limit: LIMIT, ...filters });
  const currency = await getCurrencyFormat();

  return (
    <>
      <ViewHeader title="Transactions" summary="Most recent first" eyebrow="Personal ledger" />
      <Card>
        <CardHeader>
          <CardTitle>All transactions</CardTitle>
          <CardDescription>Every income and expense, newest first.</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <TransactionList
            initialItems={page.items}
            initialNextCursor={page.nextCursor}
            currency={currency}
            filters={filters}
          />
        </CardContent>
      </Card>
    </>
  );
}
