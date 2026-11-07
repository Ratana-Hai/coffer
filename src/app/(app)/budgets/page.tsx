import { BudgetList } from "@/features/budgets/components/BudgetList";
import { getBudgets } from "@/features/budgets/queries";

export default async function BudgetsPage() {
  const data = await getBudgets();
  return <BudgetList data={data} />;
}
