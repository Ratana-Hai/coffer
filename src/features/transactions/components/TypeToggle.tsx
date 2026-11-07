"use client";

import { cn } from "@/lib/utils";
import type { TransactionType } from "../types";

const OPTIONS: Array<{ value: TransactionType; label: string }> = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

export function TypeToggle({
  value,
  onChange,
}: {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Transaction type"
      className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-11 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
            value === option.value ? "bg-panel text-foreground shadow-sm" : "text-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
