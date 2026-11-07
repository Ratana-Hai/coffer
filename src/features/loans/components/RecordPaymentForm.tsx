"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordPayment } from "../actions";

function localToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function RecordPaymentForm({ loanId }: { loanId: string }) {
  const [, formAction, pending] = useActionState(recordPayment, { ok: true });

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="loanId" value={loanId} />
      <Input
        name="amount"
        type="number"
        min="0.01"
        step="0.01"
        inputMode="decimal"
        required
        placeholder="Amount"
        aria-label="Payment amount"
        className="w-32"
      />
      <Input
        name="date"
        type="date"
        defaultValue={localToday()}
        required
        aria-label="Payment date"
        className="w-40"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Recording…" : "Record payment"}
      </Button>
    </form>
  );
}
