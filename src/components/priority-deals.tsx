"use client";

import { Zap, ExternalLink } from "lucide-react";
import type { MonthlyGoal, PipelineMeta } from "@/lib/pipeline-types";
import { formatDisplayDate, formatEur, hubspotDealUrl } from "@/lib/utils";

const CAT_COLOR: Record<string, string> = {
  Upside: "bg-blue-50 text-blue-800 border-blue-100",
  Pipeline: "bg-violet-50 text-violet-800 border-violet-100",
  "Closed Lost": "bg-rose-50 text-rose-800 border-rose-100",
  "Not Forecasted": "bg-slate-100 text-slate-700 border-slate-200",
};

interface PriorityDealsProps {
  goal: MonthlyGoal;
  meta: PipelineMeta;
}

export default function PriorityDeals({ goal, meta }: PriorityDealsProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-5 h-5 text-amber-600" aria-hidden />
        <h3 className="text-lg font-semibold text-slate-900">Focus this week</h3>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Open deals closing in {goal.quarterLabel ?? goal.monthLabel} — highest impact on the quarterly goal.
      </p>
      <ul className="space-y-3 flex-1">
        {goal.priorityDeals.map((deal) => {
          const href = hubspotDealUrl(meta.hubspotPortalId, deal.id, meta.hubspotDealBaseOrigin);
          const cardClass = `rounded-lg border p-3 space-y-2 block transition-colors ${
            deal.engagementRisk
              ? "bg-amber-50/60 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
              : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
          }`;

          const cardBody = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 inline-flex items-center gap-1">
                    {deal.name}
                    {href ? <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" aria-hidden /> : null}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${CAT_COLOR[deal.category] ?? CAT_COLOR["Not Forecasted"]}`}
                    >
                      {deal.category}
                    </span>
                    {deal.dealScore != null ? (
                      <span className="text-[10px] text-slate-600 tabular-nums">
                        Score {Math.round(deal.dealScore)}
                      </span>
                    ) : null}
                    {deal.validTouchpoints != null ? (
                      <span className="text-[10px] text-slate-600 tabular-nums">
                        {deal.validTouchpoints} touch{deal.validTouchpoints === 1 ? "" : "es"}
                      </span>
                    ) : null}
                  </div>
                  {deal.engagementRisk ? (
                    <p className="text-[10px] text-amber-800 font-medium mt-1">Low engagement — plan outreach</p>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatEur(deal.amount)}</p>
                  <p className="text-[10px] text-teal-700">{formatEur(deal.weighted)} wt.</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                    Close {deal.closeDate ? formatDisplayDate(deal.closeDate) : "—"}
                  </p>
                </div>
              </div>
              {deal.nextStep ? (
                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-2 line-clamp-3">
                  {deal.nextStep}
                </p>
              ) : null}
            </>
          );

          return (
            <li key={deal.id}>
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={cardClass}>
                  {cardBody}
                </a>
              ) : (
                <div className={cardClass}>{cardBody}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
