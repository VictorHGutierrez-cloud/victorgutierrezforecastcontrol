"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import type { PipelineData } from "@/lib/pipeline-types";
import { MomentumChartLegend } from "@/components/charts/momentum-composed-chart";
import {
  REPORT_CHART_COLORS,
  buildCategoryTotalsChart,
  buildCloseMonthCategoryChart,
  buildCountryOpenPipelineChart,
  buildCurrentMonthCloseChart,
} from "@/lib/chart-report-data";
import { payloadToBarItems } from "@/lib/chart-payload";
import type { MonthlyGoal } from "@/lib/pipeline-types";

const MomentumComposedChart = dynamic(
  () => import("@/components/charts/momentum-composed-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

const HorizontalPipelineBarChart = dynamic(
  () => import("@/components/charts/horizontal-pipeline-bar-chart"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

const StackedCategoryAreaChart = dynamic(
  () => import("@/components/charts/stacked-category-area-chart"),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return (
    <div className="h-72 w-full rounded-lg bg-slate-100 animate-pulse flex items-center justify-center text-sm text-slate-500">
      Loading chart…
    </div>
  );
}

function ReportChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">{description}</p>
      {children}
    </article>
  );
}

interface PipelineReportsSectionProps {
  pipelineData: PipelineData;
  goal: MonthlyGoal;
}

export default function PipelineReportsSection({ pipelineData, goal }: PipelineReportsSectionProps) {
  const byCloseMonth = buildCloseMonthCategoryChart(pipelineData.chartSeries, pipelineData.chartMonths);
  const categoryTotals = buildCategoryTotalsChart(pipelineData.summary);
  const byCountry = buildCountryOpenPipelineChart(pipelineData.deals);
  const thisMonthClose = buildCurrentMonthCloseChart(pipelineData.deals, goal.month);

  const categoryBars = payloadToBarItems(categoryTotals);
  const countryBars = payloadToBarItems(byCountry);
  const thisMonthBars = payloadToBarItems(thisMonthClose);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-slate-700" aria-hidden />
        <div>
          <h2 className="section-heading text-slate-600">Pipeline reports</h2>
          <p className="text-sm text-slate-500 mt-1">
            Visual breakdown from your last HubSpot export — gradients, tooltips, and clearer axes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ReportChartCard
          title="Monthly momentum"
          description="Secured (closed won), weighted forecast, and trend projection by week — same view as the briefing chart."
        >
          <MomentumChartLegend />
          <MomentumComposedChart goal={goal} className="h-72 w-full" />
        </ReportChartCard>

        <ReportChartCard
          title="Pipeline by close month"
          description="Nominal € in each forecast category for deals with close date by month (from export)."
        >
          <StackedCategoryAreaChart payload={byCloseMonth} colors={REPORT_CHART_COLORS} />
        </ReportChartCard>

        <ReportChartCard
          title={`Closing ${goal.monthLabel}`}
          description="Deals with close date this month — nominal € by HubSpot forecast category."
        >
          {thisMonthBars.length > 0 ? (
            <HorizontalPipelineBarChart items={thisMonthBars} colors={REPORT_CHART_COLORS} />
          ) : (
            <StackedCategoryAreaChart payload={thisMonthClose} colors={REPORT_CHART_COLORS} />
          )}
        </ReportChartCard>

        <ReportChartCard
          title="Full pipeline mix"
          description="All deals in the export — split by Upside, Pipeline, Closed Won, and Not forecasted."
        >
          <HorizontalPipelineBarChart items={categoryBars} colors={REPORT_CHART_COLORS} />
        </ReportChartCard>

        <ReportChartCard
          title="Open pipeline by country"
          description="Open deals (excluding Closed Won) — top countries by nominal amount."
        >
          <HorizontalPipelineBarChart items={countryBars} colors={REPORT_CHART_COLORS} />
        </ReportChartCard>
      </div>
    </section>
  );
}
