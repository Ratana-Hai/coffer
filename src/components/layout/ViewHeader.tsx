export function ViewHeader({
  title,
  summary,
  eyebrow,
}: {
  title: string;
  summary?: string;
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-medium tracking-[0.18em] text-accent uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {summary ? <p className="text-sm text-muted">{summary}</p> : null}
    </header>
  );
}
