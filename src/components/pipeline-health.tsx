"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, CalendarPlus, Target, TrendingDown } from "lucide-react";
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
        Deal score, valid touchpoints &amp; activity · Stale flags skip deals with a future task scheduled
      </p>

      <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        {health.avgDealScore != null ? (
          <motion.div layout className="rounded-lg bg-teal-50 border border-teal-200 p-4">
            <Target className="w-4 h-4 text-teal-800 mb-2" aria-hidden />
            <p className="text-[10px] uppercase tracking-wide text-teal-900/70">Avg. deal score</p>
            <p className="text-xl font-semibold text-teal-950 tabular-nums">{health.avgDealScore}</p>
            <p className="text-[10px] text-teal-900/70 mt-1">HubSpot 0–100 on open deals</p>
          </motion.div>
        ) : null}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <AlertTriangle className="w-4 h-4 text-amber-800 mb-2" aria-hidden />
          <p className="text-[10px] uppercase tracking-wide text-amber-900/70">Needs attention</p>
          <p className="text-xl font-semibold text-amber-950 tabular-nums">{health.staleDealCount}</p>
          <p className="text-[10px] text-amber-900/70 mt-1">
            Stale / early + quiet
            {(health.scheduledFollowupCount ?? 0) > 0
              ? ` · ${health.scheduledFollowupCount} follow-up(s) scheduled`
              : ""}
          </p>
        </div>
      </motion.div>

      {(health.improvementPoints?.length ?? 0) > 0 ? (
        <div className="mb-8 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-blue-800" aria-hidden />
            <h3 className="text-sm font-medium text-slate-900">Improvement points</h3>
          </div>
          <ul className="space-y-1.5 text-sm text-slate-700">
            {health.improvementPoints!.map((line, i) => (
              <li key={i} className="flex gap-2 leading-relaxed">
                <span className="text-blue-600 shrink-0">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
                  {d.reason ? (
                    <p className="text-[11px] text-amber-900/80 mt-0.5">{d.reason}</p>
                  ) : null}
                </div>
                <div className="text-right text-xs text-slate-600 tabular-nums shrink-0">
                  <span className="text-slate-800">{formatEur(d.amount)}</span>
                  <span className="mx-1">·</span>
                  age {d.ageDays}d
                  {d.daysSinceValidTouchpoint != null ? (
                    <span> · last touch {d.daysSinceValidTouchpoint}d ago</span>
                  ) : d.daysSinceActivity != null ? (
                    <span> · last act {d.daysSinceActivity}d ago</span>
                  ) : (
                    <span> · no activity date</span>
                  )}
                  {d.dealScore != null ? <span> · score {Math.round(d.dealScore)}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}
