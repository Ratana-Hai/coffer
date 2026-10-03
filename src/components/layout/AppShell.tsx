"use client";

import { useState, type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import type { ShellUser } from "./AccountMenu";
import { AddTransactionPanel } from "@/features/transactions/components/AddTransactionPanel";

export function AppShell({ user, children }: { user: ShellUser | null; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full">
      <Sidebar
        user={user}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        onAddTransaction={() => setAddOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-7 sm:py-7">
            {children}
          </div>
        </main>
      </div>

      <AddTransactionPanel open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
