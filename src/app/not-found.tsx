import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-start justify-center px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
        404
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">
        This page is not in the ledger.
      </h1>
      <p className="mt-4 max-w-lg leading-7 text-muted">
        The page you requested does not exist or has moved.
      </p>
      <Link
        className="mt-8 rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-ink transition-opacity hover:opacity-85"
        href="/"
      >
        Return home
      </Link>
    </main>
  );
}
