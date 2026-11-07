"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES, currencyFormat } from "@/lib/finance/currency";
import { fmtMoney } from "@/lib/finance/money";
import { cn } from "@/lib/utils";
import type { SettingsFormValues } from "../types";

export function CurrencyCard() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<SettingsFormValues>();
  const currencyCode = watch("currencyCode");
  const customSymbol = watch("customSymbol");

  const preview = fmtMoney(123456, currencyFormat(currencyCode, customSymbol || null));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display currency</CardTitle>
        <CardDescription>Applies to every amount in Coffer.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pb-6">
        <Controller
          control={control}
          name="currencyCode"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Currency" className="grid grid-cols-2 gap-2">
              {CURRENCIES.map((currency) => {
                const active = field.value === currency.code;
                return (
                  <button
                    key={currency.code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => field.onChange(currency.code)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      active ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface/70",
                    )}
                  >
                    <span>{currency.code}</span>
                    <span className="text-muted">{currency.symbol}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
        <div className="grid gap-2">
          <Label htmlFor="customSymbol">Or use a custom symbol</Label>
          <Input id="customSymbol" maxLength={4} placeholder="$" {...register("customSymbol")} />
          {errors.customSymbol ? (
            <p className="text-sm text-negative">{errors.customSymbol.message}</p>
          ) : null}
        </div>
        <p className="text-sm text-muted">
          Preview:{" "}
          <span className="font-medium tabular-nums text-foreground">{preview}</span>
        </p>
      </CardContent>
    </Card>
  );
}
