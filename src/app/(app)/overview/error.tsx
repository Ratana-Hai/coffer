"use client";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className="rounded-3xl border border-line bg-panel p-6" role="alert">
      <h1 className="text-lg font-semibold">Overview could not load</h1>
      <p className="mt-2 text-sm text-muted">
        Your ledger is unchanged. Try loading the overview again.
      </p>
      <button
        className="mt-5 min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
        onClick={() => retry()}
        type="button"
      >
        Try again
      </button>
      <span className="sr-only">{error.digest}</span>
    </section>
  );
}
