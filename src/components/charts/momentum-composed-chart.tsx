"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { MonthlyGoal } from "@/lib/pipeline-types";
import { formatCompactEur } from "@/lib/utils";

const chartConfig = {
  Secured: { label: "Secured", color: "#0d9488" },
  Weighted: { label: "Weighted", color: "#2563eb" },
  Trend: { label: "Trend (projection)", color: "#78716c" },
} satisfies ChartConfig;

interface MomentumComposedChartProps {
  goal: MonthlyGoal;
  className?: string;
}

export default function MomentumComposedChart({ goal, className = "h-72 w-full" }: MomentumComposedChartProps) {
  const data = goal.trend.map((t) => ({
    week: t.week,
    Secured: Math.round(t.secured),
    securedArea: Math.round(t.secured),
    Weighted: Math.round(t.weighted),
    Trend: Math.round(t.trend),
  }));

  return (
    <ChartContainer config={chartConfig} className={className}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="securedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartConfig.Secured.color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={chartConfig.Secured.color} stopOpacity={0.04} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />

        <XAxis
          dataKey="week"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickMargin={10}
        />

        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickFormatter={(v) => formatCompactEur(Number(v))}
          tickMargin={8}
          width={52}
        />

        <ChartTooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const filtered = payload.filter((p) => p.dataKey !== "securedArea");
            return (
              <ChartTooltipContent
                active
                payload={filtered}
                label={label}
                formatter={(value) => (
                  <span className="font-mono font-medium tabular-nums text-slate-900">
                    {formatCompactEur(Number(value))}
                  </span>
                )}
              />
            );
          }}
          cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
        />

        <Area
          type="monotone"
          dataKey="securedArea"
          stroke="transparent"
          fill="url(#securedGradient)"
          isAnimationActive={false}
        />

        <Line
          type="monotone"
          dataKey="Secured"
          stroke={chartConfig.Secured.color}
          strokeWidth={2}
          dot={{ r: 4, fill: "#fff", strokeWidth: 2, stroke: chartConfig.Secured.color }}
          activeDot={{ r: 5 }}
        />

        <Line
          type="monotone"
          dataKey="Weighted"
          stroke={chartConfig.Weighted.color}
          strokeWidth={2}
          dot={{ r: 4, fill: "#fff", strokeWidth: 2, stroke: chartConfig.Weighted.color }}
        />

        <Line
          type="monotone"
          dataKey="Trend"
          stroke={chartConfig.Trend.color}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 3, fill: "#fff", strokeWidth: 2, stroke: chartConfig.Trend.color }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

function ChartLegendStrip() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mb-3">
      {(["Secured", "Weighted", "Trend"] as const).map((key) => (
        <span key={key} className="inline-flex items-center gap-1.5">
          <span
            className="size-3 rounded-full border-2 border-white shadow-sm"
            style={{
              backgroundColor: key === "Trend" ? "transparent" : chartConfig[key].color,
              borderColor: chartConfig[key].color,
              ...(key === "Trend" ? { borderStyle: "dashed" } : {}),
            }}
          />
          {chartConfig[key].label}
        </span>
      ))}
    </div>
  );
}

export function MomentumChartLegend() {
  return <ChartLegendStrip />;
}
