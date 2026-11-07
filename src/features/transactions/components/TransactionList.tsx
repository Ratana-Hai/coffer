"use client";

import { useEffect, useRef, useState } from "react";
import type { CurrencyFormat } from "@/lib/finance/currency";
import { loadMoreTransactions } from "../actions";
import type { Transaction, TransactionFilters } from "../types";
import { TransactionRow } from "./TransactionRow";

export function TransactionList({
  initialItems,
  initialNextCursor,
  currency,
  filters,
}: {
  initialItems: Transaction[];
  initialNextCursor: string | null;
  currency: CurrencyFormat;
  filters: TransactionFilters;
}) {
  const [items, setItems] = useState<Transaction[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [prevInitialItems, setPrevInitialItems] = useState<Transaction[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Revalidate (add/delete) or a filter change streams fresh first-page props —
  // reset the accumulated list to match, without an effect (React "adjust state
  // when props change" pattern).
  if (initialItems !== prevInitialItems) {
    setPrevInitialItems(initialItems);
    setItems(initialItems);
    setNextCursor(initialNextCursor);
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        loadMoreTransactions(nextCursor, filters)
          .then((page) => {
            setItems((previous) => [...previous, ...page.items]);
            setNextCursor(page.nextCursor);
          })
          .finally(() => {
            loadingRef.current = false;
            setLoading(false);
          });
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, filters]);

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
        No transactions yet — add your first one above.
      </p>
    );
  }

  return (
    <div className="min-w-0">
      <ul className="min-w-0">
        {items.map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} currency={currency} />
        ))}
      </ul>
      {nextCursor ? (
        <div
          ref={sentinelRef}
          aria-hidden="true"
          className="flex h-12 items-center justify-center text-xs text-muted"
        >
          {loading ? "Loading…" : null}
        </div>
      ) : null}
    </div>
  );
}
