"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import type { PipelineData } from "@/lib/pipeline-types";
import {
  REPORT_CHART_COLORS,
  buildCategoryTotalsChart,
  buildCloseMonthCategoryChart,
  buildCountryOpenPipelineChart,
  buildCurrentMonthCloseChart,
  buildMomentumChartData,
} from "@/lib/chart-report-data";
import type { MonthlyGoal } from "@/lib/pipeline-types";

const AreaChart = dynamic(() => import("@/components/ui/area-chart").then((m) => m.AreaChart), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full rounded-lg bg-slate-100 animate-pulse flex items-center justify-center text-sm text-slate-500">
      Loading chart…
    </div>
  ),
});

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
  const momentum = buildMomentumChartData(goal);
  const byCloseMonth = buildCloseMonthCategoryChart(pipelineData.chartSeries, pipelineData.chartMonths);
  const categoryTotals = buildCategoryTotalsChart(pipelineData.summary);
  const byCountry = buildCountryOpenPipelineChart(pipelineData.deals);
  const thisMonthClose = buildCurrentMonthCloseChart(pipelineData.deals, goal.month);

  const colors = [...REPORT_CHART_COLORS];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-slate-700" aria-hidden />
        <div>
          <h2 className="section-heading text-slate-600">Pipeline reports</h2>
          <p className="text-sm text-slate-500 mt-1">
            Visual breakdown from your last HubSpot export — stacked areas show mix; lines show cumulative momentum.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ReportChartCard
          title="Monthly momentum"
          description="Secured (closed won), weighted forecast, and trend projection by week — same view as the briefing chart."
        >
          <AreaChart
            className="h-72"
            index={momentum.index}
            categories={momentum.categories}
            data={momentum.data}
            colors={["#0d9488", "#2563eb", "#78716c"]}
            stacked={false}
          />
        </ReportChartCard>

        <ReportChartCard
          title="Pipeline by close month"
          description="Nominal € in each forecast category for deals with close date in May vs June (from export)."
        >
          <AreaChart
            className="h-72"
            index={byCloseMonth.index}
            categories={byCloseMonth.categories}
            data={byCloseMonth.data}
            colors={colors}
            stacked
          />
        </ReportChartCard>

        <ReportChartCard
          title={`Closing ${goal.monthLabel}`}
          description="Deals with close date this month — nominal € by HubSpot forecast category."
        >
          <AreaChart
            className="h-72"
            index={thisMonthClose.index}
            categories={thisMonthClose.categories}
            data={thisMonthClose.data}
            colors={colors}
            stacked
          />
        </ReportChartCard>

        <ReportChartCard
          title="Full pipeline mix"
          description="All deals in the export — split by Upside, Pipeline, Closed Won, and Not forecasted."
        >
          <AreaChart
            className="h-72"
            index={categoryTotals.index}
            categories={categoryTotals.categories}
            data={categoryTotals.data}
            colors={colors}
            stacked
          />
        </ReportChartCard>

        <ReportChartCard
          title="Open pipeline by country"
          description="Open deals (excluding Closed Won) — top countries by nominal amount."
        >
          <AreaChart
            className="h-72"
            index={byCountry.index}
            categories={byCountry.categories}
            data={byCountry.data}
            colors={colors}
            stacked
          />
        </ReportChartCard>
      </div>
    </section>
  );
}
