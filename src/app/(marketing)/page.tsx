import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 sm:py-12">
      <header className="flex items-center justify-between">
        <Link className="text-xl font-semibold tracking-tight" href="/">
          coffer<span className="text-accent">.</span>
        </Link>
        <span className="rounded-full border border-line px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted">
          private beta
        </span>
      </header>

      <section className="grid gap-12 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="max-w-3xl">
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Money, made legible
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-7xl">
            A calmer way to know where your money goes.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
            Coffer is a personal finance workspace for a clear ledger, useful
            budgets, and decisions that feel a little less overwhelming.
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-panel p-6 shadow-[0_24px_80px_-48px_var(--accent)] sm:p-8">
          <div className="flex items-center justify-between border-b border-line pb-5">
            <span className="text-sm font-medium">Your overview</span>
            <span className="text-xs text-muted">Coming soon</span>
          </div>
          <div className="py-8">
            <p className="text-sm text-muted">Total balance</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">$12,480.00</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-accent-soft p-4">
              <p className="text-xs text-muted">This month</p>
              <p className="mt-2 font-medium">+$2,840</p>
            </div>
            <div className="rounded-2xl bg-surface p-4">
              <p className="text-xs text-muted">Spent</p>
              <p className="mt-2 font-medium">$1,260</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Built for one person and their real life.</span>
        <span>Project scaffold · 2026</span>
      </footer>
    </main>
  );
}
