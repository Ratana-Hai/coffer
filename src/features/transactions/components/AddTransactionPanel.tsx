"use client";

import { Button } from "@/components/ui/button";
import { ResponsivePanel } from "@/components/shared/ResponsivePanel";

export function AddTransactionPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ResponsivePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Add transaction"
      description="Record an income or expense."
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="add-transaction-form" disabled>
            Save
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
        <p className="font-medium text-foreground">Transaction form</p>
        <p>Description, amount, category and date land here.</p>
      </div>
    </ResponsivePanel>
  );
}
