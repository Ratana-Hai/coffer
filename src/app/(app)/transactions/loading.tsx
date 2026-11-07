export default function Loading() {
  return (
    <div aria-label="Loading transactions" className="space-y-5">
      <div className="h-[4.25rem] animate-pulse border-b border-line" />
      <div className="rounded-3xl border border-line bg-panel p-6">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="flex h-[3.25rem] animate-pulse items-center gap-3 border-b border-line/70 last:border-0"
          >
            <div className="size-8 rounded-lg bg-surface" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-1/2 rounded bg-surface" />
              <div className="h-2.5 w-1/3 rounded bg-surface" />
            </div>
            <div className="h-3 w-16 rounded bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
