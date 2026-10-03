"use client";

import { usePathname } from "next/navigation";

export function FooterNote() {
  const pathname = usePathname();
  const text =
    pathname === "/settings"
      ? "Settings apply when you save — everything else saves automatically."
      : "Saved automatically — only visible to you.";

  return <p className="text-xs text-muted">{text}</p>;
}
