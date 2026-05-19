"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { payloadToSeriesRows, type ChartPayload } from "@/lib/chart-payload";
import { REPORT_CHART_COLORS } from "@/lib/chart-report-data";
import { formatCompactEur } from "@/lib/utils";

interface StackedCategoryAreaChartProps {
  payload: ChartPayload;
  className?: string;
  colors?: readonly string[];
}

export default function StackedCategoryAreaChart({
  payload,
  className = "h-72 w-full",
  colors = REPORT_CHART_COLORS,
}: StackedCategoryAreaChartProps) {
  const data = payloadToSeriesRows(payload);
  const indexKey = payload.index;

  const chartConfig = Object.fromEntries(
    payload.categories.map((cat, i) => [cat, { label: cat, color: colors[i % colors.length] }]),
  ) satisfies ChartConfig;

  if (data.length === 0) {
    return <p className="text-sm text-slate-500 py-12 text-center">No values to chart in this export.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className={className}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
        <defs>
          {payload.categories.map((cat, i) => (
            <linearGradient key={cat} id={`fill-${cat.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.45} />
              <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0.08} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />

        <XAxis
          dataKey={indexKey}
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
          width={52}
          tickMargin={8}
        />

        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, items) => (
                <span className="text-slate-500">{String(items?.[0]?.payload?.[indexKey] ?? "")}</span>
              )}
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums">{formatCompactEur(Number(value))}</span>
              )}
            />
          }
        />

        {payload.categories.map((cat, i) => (
          <Area
            key={cat}
            type="monotone"
            dataKey={cat}
            stackId="stack"
            stroke={colors[i % colors.length]}
            fill={`url(#fill-${cat.replace(/\s+/g, "-")})`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
