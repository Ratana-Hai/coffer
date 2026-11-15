import { GoalGrid } from "@/features/goals/components/GoalGrid";
import { getGoals } from "@/features/goals/queries";

export default async function GoalsPage() {
  const data = await getGoals();
  return <GoalGrid data={data} />;
}
