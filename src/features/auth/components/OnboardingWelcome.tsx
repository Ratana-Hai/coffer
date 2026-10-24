"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { skipOnboarding } from "@/features/auth/actions";

function SkipButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      Skip and use the defaults
    </Button>
  );
}

export function OnboardingWelcome({ name }: { name?: string | null }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Welcome</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {name ? `Hi, ${name}.` : "Hi."}
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-muted">
          Your ledger is ready. Add transactions by hand, set budgets, or start
          with the defaults — you can change anything later.
        </p>
        <form action={skipOnboarding} className="mt-8 flex justify-center">
          <SkipButton />
        </form>
      </div>
    </main>
  );
}
