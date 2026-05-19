"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartBarItem } from "@/lib/chart-payload";
import { REPORT_CHART_COLORS } from "@/lib/chart-report-data";
import { formatCompactEur } from "@/lib/utils";

interface HorizontalPipelineBarChartProps {
  items: ChartBarItem[];
  className?: string;
  colors?: readonly string[];
}

export default function HorizontalPipelineBarChart({
  items,
  className = "h-72 w-full",
  colors = REPORT_CHART_COLORS,
}: HorizontalPipelineBarChartProps) {
  const chartConfig = Object.fromEntries(
    items.map((item, i) => [
      item.name,
      { label: item.name, color: colors[i % colors.length] },
    ]),
  ) satisfies ChartConfig;

  const data = items.map((item) => ({ name: item.name, value: item.value }));

  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-12 text-center">No values to chart in this export.</p>
    );
  }

  const labelWidth = Math.min(120, Math.max(72, ...data.map((d) => d.name.length * 7)));

  return (
    <ChartContainer config={chartConfig} className={className}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#e2e8f0" />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickFormatter={(v) => formatCompactEur(Number(v))}
        />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={labelWidth}
          tick={{ fontSize: 11, fill: "#475569" }}
          tickFormatter={(text: string) => (text.length > 14 ? `${text.slice(0, 14)}…` : text)}
        />
        <ChartTooltip
          cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums">{formatCompactEur(Number(value))}</span>
              )}
            />
          }
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
