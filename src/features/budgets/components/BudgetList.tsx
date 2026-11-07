import { ViewHeader } from "@/components/layout/ViewHeader";
import type { BudgetsData } from "../queries";
import { BudgetRow } from "./BudgetRow";

export function BudgetList({ data }: { data: BudgetsData }) {
  const budgetedCount = data.categories.filter((category) => category.limit !== null).length;
  const totalCount = data.categories.length;

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Budgets"
        summary={`${data.monthLabel} · ${budgetedCount} of ${totalCount} categories budgeted`}
        eyebrow="Personal ledger"
      />
      <div className="space-y-3">
        {data.categories.map((category) => (
          <BudgetRow key={category.categoryKey} category={category} currency={data.currency} />
        ))}
      </div>
    </div>
  );
}
