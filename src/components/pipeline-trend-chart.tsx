"use client";

import { useEffect, useId, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthlyGoal } from "@/lib/pipeline-types";
import { formatEur } from "@/lib/utils";

interface PipelineTrendChartProps {
  goal: MonthlyGoal;
  /** Strip section chrome for use inside layout grids */
  embedded?: boolean;
}

export default function PipelineTrendChart({ goal, embedded }: PipelineTrendChartProps) {
  const [ready, setReady] = useState(false);
  const fillGradientId = `weightedFill-${useId().replace(/:/g, "")}`;
  useEffect(() => setReady(true), []);

  const chartBlock = (
    <div className={embedded ? "h-[260px] w-full -mx-1" : "h-[300px] w-full"}>
      {!ready ? (
        <div className="h-full rounded-lg bg-slate-100 animate-pulse flex items-center justify-center text-slate-500 text-sm">
          Loading chart…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={goal.trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="week" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `€${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                boxShadow: "0 10px 15px -3px rgb(15 23 42 / 0.08)",
              }}
              formatter={(value: number, name: string) => [
                formatEur(value),
                name === "secured"
                  ? "Secured"
                  : name === "weighted"
                    ? "Weighted forecast"
                    : name === "trend"
                      ? "Trend projection"
                      : name,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#64748b" }}
              formatter={(value) =>
                value === "secured"
                  ? "Secured"
                  : value === "weighted"
                    ? "Weighted"
                    : value === "trend"
                      ? "Trend"
                      : value
              }
            />
            <ReferenceLine
              y={goal.targetEur}
              stroke="#0d9488"
              strokeDasharray="6 4"
              label={{
                value: `Goal ${formatEur(goal.targetEur)}`,
                fill: "#0f766e",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            <Area type="monotone" dataKey="weighted" stroke="#2563eb" strokeWidth={2} fill={`url(#${fillGradientId})`} />
            <Line
              type="monotone"
              dataKey="secured"
              stroke="#0d9488"
              strokeWidth={2}
              dot={{ fill: "#0d9488", r: 3 }}
            />
            <Line type="monotone" dataKey="trend" stroke="#78716c" strokeWidth={1.75} strokeDasharray="6 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  if (embedded) {
    return chartBlock;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Monthly momentum</h3>
        <p className="text-sm text-slate-500 mt-1">
          Cumulative progress vs. goal · dashed line = trend projection
        </p>
      </div>
      {chartBlock}
    </section>
  );
}
