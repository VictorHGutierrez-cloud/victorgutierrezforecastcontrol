"use client";

import dynamic from "next/dynamic";
import type { MonthlyGoal } from "@/lib/pipeline-types";
import { buildMomentumChartData } from "@/lib/chart-report-data";

const AreaChart = dynamic(() => import("@/components/ui/area-chart").then((m) => m.AreaChart), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full rounded-lg bg-slate-100 animate-pulse flex items-center justify-center text-slate-500 text-sm">
      Loading chart…
    </div>
  ),
});

interface PipelineTrendChartProps {
  goal: MonthlyGoal;
  embedded?: boolean;
}

export default function PipelineTrendChart({ goal, embedded }: PipelineTrendChartProps) {
  const { data, categories, index } = buildMomentumChartData(goal);

  const chartBlock = (
    <AreaChart
      className={embedded ? "h-[260px]" : "h-80"}
      index={index}
      categories={categories}
      data={data}
      colors={["#0d9488", "#2563eb", "#78716c"]}
      stacked={false}
    />
  );

  if (embedded) {
    return chartBlock;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Monthly momentum</h3>
        <p className="text-sm text-slate-500 mt-1">
          Cumulative progress vs. goal · trend = projection line
        </p>
      </div>
      {chartBlock}
    </section>
  );
}
