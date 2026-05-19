"use client";

import { useEffect, useState } from "react";
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
}

export default function PipelineTrendChart({ goal }: PipelineTrendChartProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Monthly momentum</h3>
        <p className="text-sm text-slate-400 mt-1">
          Cumulative progress vs. goal · dashed line = trend projection
        </p>
      </div>

      <div className="h-[300px] w-full">
        {!ready ? (
          <div className="h-full rounded-xl bg-white/5 animate-pulse flex items-center justify-center text-slate-500 text-sm">
            Loading chart…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={goal.trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="weightedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => `€${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
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
                wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
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
                stroke="#34d399"
                strokeDasharray="6 4"
                label={{
                  value: `Goal ${formatEur(goal.targetEur)}`,
                  fill: "#34d399",
                  fontSize: 11,
                  position: "insideTopRight",
                }}
              />
              <Area
                type="monotone"
                dataKey="weighted"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#weightedFill)"
              />
              <Line
                type="monotone"
                dataKey="secured"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={{ fill: "#34d399", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#fbbf24"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
