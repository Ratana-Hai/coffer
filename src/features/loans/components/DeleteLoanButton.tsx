"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteLoan } from "../actions";

export function DeleteLoanButton({ loanId }: { loanId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteLoan(loanId);
      if (!result.ok) toast.error(result.message ?? "Could not delete loan");
      setConfirming(false);
    });
  }

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-label="Delete loan"
        className={cn(
          "flex size-9 items-center justify-center rounded-xl text-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50",
          confirming ? "bg-negative text-background" : "hover:bg-surface",
        )}
      >
        {confirming ? <span className="text-xs font-semibold">Confirm</span> : <X size={16} />}
      </button>
      {confirming ? (
        <p className="absolute top-full right-0 z-10 mt-1 w-56 rounded-xl border border-line bg-panel p-2 text-right text-xs text-muted shadow-lg">
          Deleting keeps its payment transactions in your ledger.
        </p>
      ) : null}
    </div>
  );
}
