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

  const metrics = [
    {
      title: "Win odds",
      value: `~${goal.winChancePct}%`,
      subtitle: chanceLabelLight(goal.winChancePct),
      valueClass: chanceTone,
    },
    {
      title: "Gap to close",
      value: formatEur(goal.gapEur),
      subtitle: `Still needed vs ${formatEur(goal.targetEur)} (secured)`,
    },
    {
      title: "Gap (forecast)",
      value: formatEur(goal.gapWeightedEur),
      subtitle: "After weighted pipeline",
      valueClass: goal.gapWeightedEur <= 0 ? "text-emerald-700" : "text-slate-900",
    },
    {
      title: "Days left",
      value: `${goal.daysLeft}`,
      subtitle: "This calendar month",
    },
    {
      title: "Avg. deal age",
      value: `${pipelineHealth.avgDealAgeDays}d`,
      subtitle: "Open pipe (not closed)",
    },
    {
      title: "Pipe created MTM",
      value: formatEur(pipelineHealth.createdThisMonthEur),
      subtitle: `${pipelineHealth.createdThisMonthCount} deals`,
    },
    {
      title: "Needs attention",
      value: `${pipelineHealth.staleDealCount}`,
      subtitle: "Stale / early & quiet",
    },
    ...(pipelineHealth.avgDealScore != null
      ? [
          {
            title: "Avg. deal score",
            value: `${pipelineHealth.avgDealScore}`,
            subtitle: "Open deals · HubSpot 0–100",
          },
        ]
      : []),
    ...((pipelineHealth.engagementRiskCount ?? 0) > 0
      ? [
          {
            title: "Engagement risk",
            value: `${pipelineHealth.engagementRiskCount}`,
            subtitle: "Low touch or score",
            valueClass: "text-amber-800",
          },
        ]
      : []),
  ];

  return (
    <section aria-label="ROW briefing" className="border border-slate-200 bg-white shadow-sm overflow-hidden rounded-xl">
      {/* Compact ROW strip — not a full grid cell */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-slate-500" aria-hidden />
          ROW coverage
        </div>
        <div className="flex flex-wrap gap-1.5 min-w-0 flex-1">
          {countries.length === 0 ? (
            <span className="text-xs text-slate-500">No countries in export</span>
          ) : (
            countries.map((c) => (
              <span
                key={c}
                className="inline-flex items-center px-2 py-0.5 rounded border border-slate-200 bg-white text-[11px] font-medium text-slate-700"
              >
                {c}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Summary + metrics — natural height, no forced squares */}
      <div className="grid lg:grid-cols-[1fr_minmax(220px,280px)] lg:items-start border-b border-slate-200">
        <div className="p-5 lg:border-r border-slate-200">
          <ExecutiveSummary bullets={bullets} embedded />
        </div>
        <div className="p-3 lg:p-4 bg-slate-50/50 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          {metrics.map((m) => (
            <MetricCell key={m.title} {...m} />
          ))}
        </div>
      </div>

      {/* Chart — full width */}
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Activity className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>Monthly momentum</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Secured vs weighted · dashed = trend</span>
        </div>
        <PipelineTrendChart goal={goal} embedded />
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
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 leading-tight">{title}</p>
      <p className={`text-base font-semibold tabular-nums mt-1 leading-tight ${valueClass}`}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">{subtitle}</p>
    </div>
  );
}
