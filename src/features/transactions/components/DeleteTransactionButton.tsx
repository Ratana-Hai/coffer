"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { deleteTransaction } from "@/features/transactions/actions";

const initialState: { ok: boolean; message?: string } = { ok: false };

export function DeleteTransactionButton({
  transactionId,
  isLoanPayment,
}: {
  transactionId: string;
  isLoanPayment: boolean;
}) {
  const [state, formAction, pending] = useActionState(deleteTransaction, initialState);
  const [confirming, setConfirming] = useState(!isLoanPayment);

  if (state.ok) return null;

  return (
    <div className="relative flex w-11 min-w-0 flex-col items-end">
      {isLoanPayment && confirming && (
        <p
          className="absolute top-full right-0 z-10 w-56 rounded-xl border border-line bg-panel p-2 text-right text-xs text-negative shadow-lg"
          role="status"
        >
          This is a loan payment. Deleting it raises the loan balance.
        </p>
      )}
      <form action={formAction}>
        <input type="hidden" name="transactionId" value={transactionId} />
        <button
          aria-label="Delete transaction"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors disabled:opacity-50"
          disabled={pending}
          onClick={(event) => {
            if (isLoanPayment && !confirming) {
              event.preventDefault();
              setConfirming(true);
            }
          }}
          type="submit"
        >
          {pending ? <span aria-hidden="true">...</span> : <X aria-hidden="true" size={16} />}
        </button>
      </form>
      {state.message && (
        <p className="max-w-56 text-right text-xs text-negative" role="alert">
          {state.message}
        </p>
      )}
    </div>
  );
}
