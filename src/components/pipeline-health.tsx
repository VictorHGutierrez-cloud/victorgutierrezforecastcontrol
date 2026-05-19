"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, CalendarPlus } from "lucide-react";
import type { PipelineHealth, PipelineMeta } from "@/lib/pipeline-types";
import { formatEur, hubspotDealUrl } from "@/lib/utils";

interface PipelineHealthProps {
  health: PipelineHealth;
  meta: PipelineMeta;
}

export default function PipelineHealthPanel({ health, meta }: PipelineHealthProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Pipeline health</h2>
      <p className="text-xs text-slate-500 mb-6">
        From create date &amp; last activity · Complements close-date forecast above
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <CalendarPlus className="w-4 h-4 text-slate-700 mb-2" aria-hidden />
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Created this month</p>
          <p className="text-xl font-semibold text-slate-900 tabular-nums">{formatEur(health.createdThisMonthEur)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{health.createdThisMonthCount} deals</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <Activity className="w-4 h-4 text-slate-700 mb-2" aria-hidden />
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Avg. deal age</p>
          <p className="text-xl font-semibold text-slate-900 tabular-nums">{health.avgDealAgeDays} days</p>
          <p className="text-[10px] text-slate-500 mt-1">Open pipeline (excl. closed won)</p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <AlertTriangle className="w-4 h-4 text-amber-800 mb-2" aria-hidden />
          <p className="text-[10px] uppercase tracking-wide text-amber-900/70">Needs attention</p>
          <p className="text-xl font-semibold text-amber-950 tabular-nums">{health.staleDealCount}</p>
          <p className="text-[10px] text-amber-900/70 mt-1">Stale / early + quiet</p>
        </div>
      </div>

      <h3 className="text-sm font-medium text-slate-800 mb-3">Top deals flagged</h3>
      {health.staleDeals.length === 0 ? (
        <p className="text-sm text-slate-500">No deals matched the attention rules this week.</p>
      ) : (
        <ul className="space-y-2">
          {health.staleDeals.map((d) => {
            const href = hubspotDealUrl(meta.hubspotPortalId, d.id, meta.hubspotDealBaseOrigin);
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 font-medium hover:text-blue-700 truncate block"
                    >
                      {d.name}
                    </a>
                  ) : (
                    <span className="text-slate-900 font-medium truncate block">{d.name}</span>
                  )}
                  <span className="text-[11px] text-slate-500">{d.stage}</span>
                </div>
                <div className="text-right text-xs text-slate-600 tabular-nums shrink-0">
                  <span className="text-slate-800">{formatEur(d.amount)}</span>
                  <span className="mx-1">·</span>
                  age {d.ageDays}d
                  {d.daysSinceActivity != null ? (
                    <span> · last act {d.daysSinceActivity}d ago</span>
                  ) : (
                    <span> · no activity date</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}
