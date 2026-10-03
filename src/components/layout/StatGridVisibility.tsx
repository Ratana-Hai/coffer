"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function StatGridVisibility({ children }: { children: ReactNode }) {
  return usePathname() === "/settings" ? null : children;
}
