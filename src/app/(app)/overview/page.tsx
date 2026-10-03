import { OverviewPage } from "@/features/overview/components/OverviewPage";
import { getOverview } from "@/features/overview/queries";

export default async function Page() {
  const overview = await getOverview();
  return <OverviewPage overview={overview} />;
}
