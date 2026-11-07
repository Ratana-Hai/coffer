"use client";

import { useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/shared/ResponsivePanel";
import { scheduledPayment } from "@/lib/finance/amortization";
import type { CurrencyFormat } from "@/lib/finance/currency";
import { decimalToMinor, fmtMoney } from "@/lib/finance/money";
import { createLoan } from "../actions";
import { loanSchema } from "../schema";

interface AddLoanValues {
  name: string;
  principal: string;
  rate: string;
  termMonths: string;
  startDate: string;
}

function localToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function previewPayment(principal: string, rate: string, termMonths: string): number | null {
  const p = Number(principal);
  const r = Number(rate);
  const n = Number(termMonths);
  if (!Number.isFinite(p) || !Number.isFinite(r) || !Number.isFinite(n)) return null;
  if (p <= 0 || r < 0 || n < 1) return null;
  return scheduledPayment({ principal: decimalToMinor(String(p)), rate: r, termMonths: n });
}

export function AddLoanPanel({ currency }: { currency: CurrencyFormat }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddLoanValues>({
    resolver: zodResolver(loanSchema) as unknown as Resolver<AddLoanValues>,
    mode: "onTouched",
    defaultValues: { name: "", principal: "", rate: "", termMonths: "", startDate: localToday() },
  });

  const principal = useWatch({ control, name: "principal" });
  const rate = useWatch({ control, name: "rate" });
  const termMonths = useWatch({ control, name: "termMonths" });
  const preview = previewPayment(principal, rate, termMonths);

  const onSubmit = handleSubmit(async (values) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) formData.append(key, value ?? "");
    const result = await createLoan({ ok: true }, formData);
    if (result.ok) {
      reset({ name: "", principal: "", rate: "", termMonths: "", startDate: localToday() });
      setOpen(false);
      toast.success("Loan added");
    } else {
      toast.error("message" in result && result.message ? result.message : "Could not add loan");
    }
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Add loan
      </Button>
      <ResponsivePanel
        open={open}
        onOpenChange={setOpen}
        title="Add loan"
        description="Enter the terms and Coffer works out what you owe each month."
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-loan-form" disabled={isSubmitting}>
              {isSubmitting ? "Adding…" : "Add loan"}
            </Button>
          </div>
        }
      >
        <form id="add-loan-form" onSubmit={onSubmit} noValidate className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="loan-name">Loan name</Label>
            <Input id="loan-name" maxLength={60} placeholder="e.g. Car loan" {...register("name")} />
            {errors.name ? <p className="text-sm text-negative">{errors.name.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="loan-principal">Amount borrowed</Label>
            <Input
              id="loan-principal"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              {...register("principal")}
            />
            {errors.principal ? (
              <p className="text-sm text-negative">{errors.principal.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="loan-rate">Rate % / year</Label>
              <Input
                id="loan-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
                {...register("rate")}
              />
              {errors.rate ? <p className="text-sm text-negative">{errors.rate.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loan-term">Term (months)</Label>
              <Input
                id="loan-term"
                type="number"
                min="1"
                max="600"
                step="1"
                inputMode="numeric"
                placeholder="0"
                {...register("termMonths")}
              />
              {errors.termMonths ? (
                <p className="text-sm text-negative">{errors.termMonths.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="loan-start">First payment</Label>
            <Input id="loan-start" type="date" {...register("startDate")} />
            {errors.startDate ? (
              <p className="text-sm text-negative">{errors.startDate.message}</p>
            ) : null}
          </div>

          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
            {preview !== null ? (
              <>
                Estimated monthly payment:{" "}
                <span className="font-semibold tabular-nums">{fmtMoney(preview, currency)}</span>
              </>
            ) : (
              <span className="text-muted">
                Enter the amount, rate and term to preview the payment.
              </span>
            )}
          </p>
        </form>
      </ResponsivePanel>
    </>
  );
}
