"use client";

import { Activity, MapPin } from "lucide-react";
import ExecutiveSummary from "@/components/executive-summary";
import PipelineTrendChart from "@/components/pipeline-trend-chart";
import type { MonthlyGoal, PipelineHealth } from "@/lib/pipeline-types";
import { formatEur } from "@/lib/utils";

interface BriefBentoSectionProps {
  bullets: string[];
  countries: string[];
  goal: MonthlyGoal;
  pipelineHealth: PipelineHealth;
}

function chanceLabelLight(pct: number): string {
  if (pct >= 75) return "Strong";
  if (pct >= 50) return "Moderate";
  return "At risk";
}

export default function BriefBentoSection({
  bullets,
  countries,
  goal,
  pipelineHealth,
}: BriefBentoSectionProps) {
  const chanceTone =
    goal.winChancePct >= 75
      ? "text-emerald-700"
      : goal.winChancePct >= 50
        ? "text-amber-700"
        : "text-rose-700";

  return (
    <section aria-label="ROW briefing grid" className="border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="relative p-6 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <MapPin className="w-4 h-4 shrink-0 text-slate-600" aria-hidden />
            <span>ROW coverage</span>
          </div>
          <h3 className="text-xl font-normal text-slate-900 leading-snug mb-4">
            Active markets.{" "}
            <span className="text-slate-500">Countries appearing in this export.</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {countries.length === 0 ? (
              <p className="text-sm text-slate-500">No country rows in export.</p>
            ) : (
              countries.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700"
                >
                  {c}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-b border-slate-200 bg-white">
          <ExecutiveSummary bullets={bullets} embedded />
        </div>

        <div className="p-6 border-b md:border-b-0 md:border-r md:border-t border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <Activity className="w-4 h-4 shrink-0 text-slate-600" aria-hidden />
            <span>Monthly momentum</span>
          </div>
          <h3 className="text-xl font-normal text-slate-900 leading-snug mb-1">
            Secured vs weighted.{" "}
            <span className="text-slate-500">Progress vs monthly goal · dashed line = trend.</span>
          </h3>
          <PipelineTrendChart goal={goal} embedded />
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:border-t border-slate-200 bg-white">
          <MetricCell
            title="Win odds"
            value={`~${goal.winChancePct}%`}
            subtitle={chanceLabelLight(goal.winChancePct)}
            valueClass={chanceTone}
          />
          <MetricCell title="Gap to goal" value={formatEur(goal.gapEur)} subtitle={`Target ${formatEur(goal.targetEur)}`} />
          <MetricCell title="Days left" value={`${goal.daysLeft}`} subtitle="This calendar month" />
          <MetricCell title="Avg. deal age" value={`${pipelineHealth.avgDealAgeDays}d`} subtitle="Open pipe (not closed)" />
          <MetricCell
            title="Pipe created MTM"
            value={formatEur(pipelineHealth.createdThisMonthEur)}
            subtitle={`${pipelineHealth.createdThisMonthCount} deals`}
          />
          <MetricCell
            title="Needs attention"
            value={`${pipelineHealth.staleDealCount}`}
            subtitle="Stale / early & quiet"
          />
        </div>
      </div>
    </section>
  );
}

function MetricCell({
  title,
  value,
  subtitle,
  valueClass = "text-slate-900",
}: {
  title: string;
  value: string;
  subtitle: string;
  valueClass?: string;
}) {
  return (
    <div className="p-5 flex flex-col justify-between min-h-[132px]">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{title}</p>
        <p className={`text-xl font-semibold tabular-nums mt-2 leading-tight ${valueClass}`}>{value}</p>
      </div>
      <p className="text-xs text-slate-500 mt-3 leading-snug">{subtitle}</p>
    </div>
  );
}
