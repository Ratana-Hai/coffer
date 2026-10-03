import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FooterNote } from "@/components/layout/FooterNote";
import { StatGrid, StatGridSkeleton } from "@/components/layout/StatGrid";
import { StatGridVisibility } from "@/components/layout/StatGridVisibility";
import { TimezoneSync } from "@/components/layout/TimezoneSync";
import { Toaster } from "@/components/ui/sonner";
import { getSessionUser } from "@/server/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  return (
    <>
      <AppShell user={user}>
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
