"use client";

import { useActionState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CurrencyFormat } from "@/lib/finance/currency";
import { fmtMoney } from "@/lib/finance/money";
import { addFunds, deleteGoal } from "../actions";
import type { Goal } from "../types";

export function GoalCard({ goal, currency }: { goal: Goal; currency: CurrencyFormat }) {
  const [, addFundsAction, pending] = useActionState(addFunds, { ok: true });
  const [removePending, startTransition] = useTransition();

  function handleRemove() {
    const confirm = window.confirm(
      `Remove "${goal.name}" with ${fmtMoney(goal.saved, currency)} saved?`,
    );
    if (!confirm) return;
    startTransition(async () => {
      const result = await deleteGoal(goal.id);
      if (!result.ok) toast.error(result.message ?? "Could not remove goal");
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0 truncate" title={goal.name}>
            {goal.name}
          </CardTitle>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removePending}
            aria-label="Remove goal"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pb-6">
        <p className="text-sm tabular-nums">
          <span className="font-semibold">{fmtMoney(goal.saved, currency)}</span>
          <span className="text-muted">
            {" "}
            of {fmtMoney(goal.target, currency)} ({goal.pct}%)
          </span>
        </p>

        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-accent" style={{ width: `${goal.pct}%` }} />
        </div>

        <form key={goal.saved} action={addFundsAction} className="flex items-center gap-2">
          <input type="hidden" name="goalId" value={goal.id} />
          <Input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            placeholder="Amount"
            aria-label="Add funds amount"
            className="w-32"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
