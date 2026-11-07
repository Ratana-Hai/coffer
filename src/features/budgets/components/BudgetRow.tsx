"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CurrencyFormat } from "@/lib/finance/currency";
import type { BudgetStatus } from "@/lib/finance/budget";
import { fmtMoney, minorToMajor } from "@/lib/finance/money";
import { setBudget } from "../actions";
import type { BudgetCategory } from "../queries";

const STATUS_TEXT: Record<BudgetStatus, string> = {
  good: "On track",
  warning: "Near limit",
  critical: "Over budget",
};

const STATUS_FILL: Record<BudgetStatus, string> = {
  good: "bg-good",
  warning: "bg-warning",
  critical: "bg-critical",
};

const STATUS_TEXT_COLOR: Record<BudgetStatus, string> = {
  good: "text-good",
  warning: "text-warning",
  critical: "text-critical",
};

export function BudgetRow({
  category,
  currency,
}: {
  category: BudgetCategory;
  currency: CurrencyFormat;
}) {
  const [, formAction, pending] = useActionState(setBudget, { ok: true });

  const { label, slot, limit, spent, pct, status } = category;
  const hasLimit = limit !== null;

  const spentText = fmtMoney(spent, currency);
  const limitText = limit !== null ? fmtMoney(limit, currency) : null;
  const limitInput = limit !== null ? String(minorToMajor(limit)) : undefined;

  return (
    <div className="rounded-3xl border border-line bg-panel p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: `var(--category-${slot})` }}
        />
        <p className="min-w-0 flex-1 truncate font-medium">{label}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="min-w-0 flex-1 text-sm tabular-nums">
          {limitText !== null ? (
            <>
              <span className="font-semibold">{spentText}</span>
              <span className="text-muted"> / {limitText}</span>
            </>
          ) : (
            <span className="text-muted">No limit set</span>
          )}
        </p>
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="categoryKey" value={category.categoryKey} />
          <Input
            name="monthlyLimit"
            type="number"
            min="0"
            step="0.01"
            placeholder="Limit"
            defaultValue={limitInput}
            aria-label={`${label} monthly limit`}
            className="w-28"
          />
          <Button type="submit" variant="ghost" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
      </div>

      {hasLimit && status ? (
        <>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
            <div
              className={`h-full rounded-full ${STATUS_FILL[status]}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <p
            className={`mt-2 flex items-center gap-2 text-xs font-medium ${STATUS_TEXT_COLOR[status]}`}
          >
            <span aria-hidden="true" className={`size-1.5 rounded-full ${STATUS_FILL[status]}`} />
            {STATUS_TEXT[status]} — {pct}% used
          </p>
        </>
      ) : null}
    </div>
  );
}
