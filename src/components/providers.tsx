"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import type { ThemeMode } from "@/lib/theme";

function ThemeReconciler({ mode }: { mode: ThemeMode }) {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme(mode);
  }, [mode, setTheme]);
  return null;
}

export function Providers({ children, mode }: { children: ReactNode; mode: ThemeMode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme={mode} enableSystem disableTransitionOnChange>
      <ThemeReconciler mode={mode} />
      {children}
    </ThemeProvider>
  );
}
