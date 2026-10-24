"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/features/auth/actions";
import type { ActionState } from "@/lib/action-state";

const initialState: ActionState = { ok: true };

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} noValidate className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Username</Label>
        <Input id="name" name="name" autoComplete="username" placeholder="Ada" required />
        {!state.ok && state.fieldErrors?.name ? (
          <p className="text-sm text-negative">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>
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
        Create account
      </Button>
    </form>
  );
}
