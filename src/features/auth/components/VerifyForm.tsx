"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyTotp, type VerifyState } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const initialState: VerifyState = { ok: false };

export function VerifyForm() {
  const [state, formAction, pending] = useActionState(verifyTotp, initialState);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const cooldown = !state.ok ? state.cooldownRemainingMs : undefined;
    if (!cooldown) return;

    let remaining = Math.ceil(cooldown / 1000);
    const timer = setInterval(() => {
      if (remaining >= 0) setSeconds(remaining);
      remaining -= 1;
      if (remaining < 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [state]);

  const disabled = pending || seconds > 0;
  const message = !state.ok ? state.message : undefined;

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <div key={message ?? "clean"} className={cn("grid gap-2", message && "animate-shake")}>
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          placeholder="000000"
          required
          disabled={disabled}
          className="text-center font-mono text-lg tracking-[0.3em]"
        />
        {message ? <p className="text-sm text-negative">{message}</p> : null}
        {seconds > 0 ? (
          <p className="text-sm text-muted">Too many attempts — try again in {seconds}s</p>
        ) : null}
      </div>
      <Button type="submit" disabled={disabled} className="mt-1">
        Verify
      </Button>
    </form>
  );
}
