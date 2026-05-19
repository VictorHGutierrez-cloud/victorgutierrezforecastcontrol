"use client";

import { Zap, ExternalLink } from "lucide-react";
import type { MonthlyGoal, PipelineMeta } from "@/lib/pipeline-types";
import { formatDisplayDate, formatEur, hubspotDealUrl } from "@/lib/utils";

const CAT_COLOR: Record<string, string> = {
  Upside: "bg-indigo-500/20 text-indigo-300",
  Pipeline: "bg-violet-500/20 text-violet-300",
  "Not Forecasted": "bg-slate-500/20 text-slate-300",
};

interface PriorityDealsProps {
  goal: MonthlyGoal;
  meta: PipelineMeta;
}

export default function PriorityDeals({ goal, meta }: PriorityDealsProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl h-full flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">Focus this week</h3>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        Open deals closing in {goal.monthLabel} — highest impact on the monthly goal.
      </p>
      <ul className="space-y-3 flex-1">
        {goal.priorityDeals.map((deal) => {
          const href = hubspotDealUrl(meta.hubspotPortalId, deal.id);
          return (
            <li
              key={deal.id}
              className="rounded-xl bg-white/5 border border-white/8 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                      {deal.name}
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-white truncate">{deal.name}</p>
                  )}
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
                  <p className="text-[10px] text-emerald-400">{formatEur(deal.weighted)} wt.</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                    Close {deal.closeDate ? formatDisplayDate(deal.closeDate) : "—"}
                  </p>
                </div>
              </div>
              {deal.nextStep ? (
                <p className="text-xs text-slate-400 leading-relaxed border-t border-white/6 pt-2 line-clamp-3">
                  {deal.nextStep}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
