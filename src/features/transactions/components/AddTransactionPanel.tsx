"use client";

import { useEffect } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/shared/ResponsivePanel";
import { categories } from "@/lib/finance/categories";
import { createTransaction } from "../actions";
import { transactionSchema } from "../schema";
import type { TransactionType } from "../types";
import { TypeToggle } from "./TypeToggle";

interface AddTransactionValues {
  date: string;
  desc: string;
  amount: string;
  type: TransactionType;
  category: string;
}

const manualCategories = categories.filter((category) => category.key !== "loan");

const SELECT_CLASS =
  "flex h-10 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40";

function localToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AddTransactionPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddTransactionValues>({
    resolver: zodResolver(transactionSchema) as unknown as Resolver<AddTransactionValues>,
    mode: "onTouched",
    defaultValues: { date: localToday(), desc: "", amount: "", type: "income", category: "" },
  });

  const type = useWatch({ control, name: "type" });

  useEffect(() => {
    if (open) reset({ date: localToday(), desc: "", amount: "", type: "income", category: "" });
  }, [open, reset]);

  function changeType(next: TransactionType) {
    setValue("type", next, { shouldDirty: true, shouldValidate: true });
    if (next === "income") setValue("category", "");
  }

  const onSubmit = handleSubmit(async (values) => {
    const formData = new FormData();
    formData.append("date", values.date);
    formData.append("desc", values.desc);
    formData.append("amount", values.amount);
    formData.append("type", values.type);
    if (values.type === "expense") formData.append("category", values.category);

    const result = await createTransaction({ ok: true }, formData);
    if (result.ok) {
      reset({ date: localToday(), desc: "", amount: "", type: "income", category: "" });
      onOpenChange(false);
      toast.success("Transaction added");
    } else {
      toast.error("message" in result && result.message ? result.message : "Could not add transaction");
    }
  });

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
          <Button type="submit" form="add-transaction-form" disabled={isSubmitting}>
            {isSubmitting ? "Adding…" : "Add"}
          </Button>
        </div>
      }
    >
      <form id="add-transaction-form" onSubmit={onSubmit} noValidate className="grid gap-4">
        <TypeToggle value={type} onChange={changeType} />

        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date ? <p className="text-sm text-negative">{errors.date.message}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="desc">Description</Label>
          <Input
            id="desc"
            maxLength={120}
            placeholder="e.g. Groceries at market"
            {...register("desc")}
          />
          {errors.desc ? <p className="text-sm text-negative">{errors.desc.message}</p> : null}
        </div>

        {type === "expense" ? (
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <select id="category" className={SELECT_CLASS} {...register("category")}>
              <option value="">Choose a category</option>
              {manualCategories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category ? (
              <p className="text-sm text-negative">{errors.category.message}</p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            {...register("amount")}
          />
          {errors.amount ? <p className="text-sm text-negative">{errors.amount.message}</p> : null}
        </div>
      </form>
    </ResponsivePanel>
  );
}
