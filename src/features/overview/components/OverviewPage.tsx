import { CategoryChart } from "@/features/overview/components/CategoryChart";
import { RecentActivity } from "@/features/overview/components/RecentActivity";
import { TrendChart } from "@/features/overview/components/TrendChart";
import type { OverviewData } from "@/features/overview/types";
import { WidgetBoundary } from "@/components/shared/WidgetBoundary";
import { ViewHeader } from "@/components/layout/ViewHeader";

export function OverviewPage({ overview }: { overview: OverviewData }) {
  return (
    <div className="space-y-5">
      <ViewHeader title="Overview" summary={overview.monthLabel} eyebrow="Personal ledger" />

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-3xl border border-line bg-panel p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="font-semibold tracking-tight">Spending by category</h2>
            <p className="mt-1 text-sm text-muted">This month&apos;s expenses, by category</p>
          </div>
          <WidgetBoundary title="Spending by category">
            <CategoryChart
              categories={overview.byCategory}
              currency={overview.currency}
              total={overview.byCategory.reduce((sum, category) => sum + category.total, 0)}
            />
          </WidgetBoundary>
        </section>

        <section className="min-w-0 rounded-3xl border border-line bg-panel p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="font-semibold tracking-tight">Income vs. expenses</h2>
            <p className="mt-1 text-sm text-muted">Last 6 months</p>
          </div>
          <WidgetBoundary title="Income vs. expenses">
            <TrendChart currency={overview.currency} trend={overview.trend} />
          </WidgetBoundary>
        </section>
      </div>

      <WidgetBoundary title="Recent activity">
        <RecentActivity overview={overview} />
      </WidgetBoundary>
    </div>
  );
}
