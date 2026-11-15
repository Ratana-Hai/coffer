import { ViewHeader } from "@/components/layout/ViewHeader";
import type { GoalsData } from "../queries";
import { AddGoalPanel } from "./AddGoalPanel";
import { GoalCard } from "./GoalCard";

export function GoalGrid({ data }: { data: GoalsData }) {
  const count = data.goals.length;
  const summary =
    count > 0 ? `${count} active ${count === 1 ? "goal" : "goals"}` : undefined;

  return (
    <>
      <ViewHeader title="Savings goals" summary={summary} eyebrow="Personal ledger" />
      <AddGoalPanel />
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Your goals</h2>
        <p className="mt-1 text-sm text-muted">Progress toward each target.</p>
        {count > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} currency={data.currency} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
            No savings goals yet — create one above.
          </p>
        )}
      </section>
    </>
  );
}
