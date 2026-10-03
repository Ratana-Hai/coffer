export default function Loading() {
  return (
    <div aria-label="Loading overview" className="space-y-5">
      <div className="h-[4.25rem] animate-pulse border-b border-line" />
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="h-[27.5rem] animate-pulse rounded-3xl border border-line bg-panel sm:h-[21rem]"
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="h-[23.5rem] animate-pulse rounded-3xl border border-line bg-panel sm:h-[24.5rem]"
      />
    </div>
  );
}
