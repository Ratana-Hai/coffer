"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestSignIn } from "@/features/auth/actions";
import type { ActionState } from "@/lib/action-state";

const initialState: ActionState = { ok: true };

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(requestSignIn, initialState);

  return (
    <form action={formAction} noValidate className="grid gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        {!state.ok && state.fieldErrors?.email ? (
          <p className="text-sm text-negative">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending} className="mt-1">
        Email me a sign-in link
      </Button>
    </form>
  );
}
