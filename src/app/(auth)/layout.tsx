import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-xl font-semibold tracking-tight"
      >
        coffer<span className="text-accent">.</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
