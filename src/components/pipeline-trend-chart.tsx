"use client";

import dynamic from "next/dynamic";
import type { MonthlyGoal } from "@/lib/pipeline-types";
import { MomentumChartLegend } from "@/components/charts/momentum-composed-chart";

const MomentumComposedChart = dynamic(
  () => import("@/components/charts/momentum-composed-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] w-full rounded-lg bg-slate-100 animate-pulse flex items-center justify-center text-slate-500 text-sm">
        Loading chart…
      </div>
    ),
  },
);

interface PipelineTrendChartProps {
  goal: MonthlyGoal;
  embedded?: boolean;
}

export default function PipelineTrendChart({ goal, embedded }: PipelineTrendChartProps) {
  const chartBlock = (
    <>
      <MomentumChartLegend />
      <MomentumComposedChart goal={goal} className={embedded ? "h-[260px] w-full" : "h-80 w-full"} />
    </>
  );

  if (embedded) {
    return chartBlock;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Monthly momentum</h3>
        <p className="text-sm text-slate-500 mt-1">
          Secured vs weighted forecast by week · dashed line = trend projection
        </p>
      </div>
      {chartBlock}
    </section>
  );
}
