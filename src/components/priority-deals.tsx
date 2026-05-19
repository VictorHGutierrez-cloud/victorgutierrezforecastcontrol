"use client";

import { Zap } from "lucide-react";
import type { MonthlyGoal } from "@/lib/pipeline-types";
import { formatEur } from "@/lib/utils";

const CAT_COLOR: Record<string, string> = {
  Upside: "bg-indigo-500/20 text-indigo-300",
  Pipeline: "bg-violet-500/20 text-violet-300",
  "Not Forecasted": "bg-slate-500/20 text-slate-300",
};

interface PriorityDealsProps {
  goal: MonthlyGoal;
}

export default function PriorityDeals({ goal }: PriorityDealsProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl h-full">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">Close to hit goal</h3>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        May deals that move the needle — weighted contribution shown.
      </p>
      <ul className="space-y-3">
        {goal.priorityDeals.map((deal) => (
          <li
            key={deal.name}
            className="flex items-start justify-between gap-3 rounded-xl bg-white/5 border border-white/8 p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{deal.name}</p>
              <span
                className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${CAT_COLOR[deal.category] ?? CAT_COLOR["Not Forecasted"]}`}
              >
                {deal.category}
              </span>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-white tabular-nums">
                {formatEur(deal.amount)}
              </p>
              <p className="text-[10px] text-emerald-400">+{formatEur(deal.weighted)} wt.</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
