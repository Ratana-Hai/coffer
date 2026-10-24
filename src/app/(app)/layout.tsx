import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { FooterNote } from "@/components/layout/FooterNote";
import { StatGrid, StatGridSkeleton } from "@/components/layout/StatGrid";
import { StatGridVisibility } from "@/components/layout/StatGridVisibility";
import { TimezoneSync } from "@/components/layout/TimezoneSync";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingWelcome } from "@/features/auth/components/OnboardingWelcome";
import { getOnboardingState } from "@/features/auth/queries";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const state = await getOnboardingState();
  if (!state.authenticated) redirect("/sign-in");
  if (state.isNew) {
    return <OnboardingWelcome name={state.user.name} />;
  }

  return (
    <>
      <AppShell user={state.user}>
        <TimezoneSync />
        <StatGridVisibility>
          <Suspense fallback={<StatGridSkeleton />}>
            <StatGrid />
          </Suspense>
        </StatGridVisibility>
        {children}
        <FooterNote />
      </AppShell>
      <Toaster />
    </>
  );
}
