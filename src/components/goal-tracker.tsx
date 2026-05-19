"use client";

import { motion } from "framer-motion";
import { HelpCircle, Target, TrendingUp, Wallet, Calendar } from "lucide-react";
import type { MonthlyGoal } from "@/lib/pipeline-types";
import { formatEur } from "@/lib/utils";

interface GoalTrackerProps {
  goal: MonthlyGoal;
}

function chanceLabel(pct: number): { label: string; color: string } {
  if (pct >= 75) return { label: "Strong", color: "text-emerald-700" };
  if (pct >= 50) return { label: "Moderate", color: "text-amber-700" };
  return { label: "At risk", color: "text-rose-700" };
}

export default function GoalTracker({ goal }: GoalTrackerProps) {
  const chance = chanceLabel(goal.winChancePct);
  const circumference = 2 * Math.PI * 88;
  const offset = circumference - (goal.progressPct / 100) * circumference;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
    >
      <motion.div className="flex flex-col lg:flex-row gap-8 items-center">
        <div className="relative shrink-0">
          <svg width="200" height="200" className="-rotate-90">
            <circle cx="100" cy="100" r="88" fill="none" stroke="#e2e8f0" strokeWidth="14" />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="url(#goalRingLight)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="goalRingLight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold text-slate-900 tabular-nums">
              {goal.progressPct}%
            </span>
            <span className="text-xs text-slate-500 mt-1">of monthly goal</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-1">
              {goal.monthLabel} target
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-7 h-7 text-slate-700" aria-hidden />
              {formatEur(goal.targetEur)} goal
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                {
                  icon: Wallet,
                  label: "Secured",
                  value: formatEur(goal.securedEur),
                  sub: "Closed won",
                  tip: "100% of Closed Won deal value in this calendar month (close date).",
                },
                {
                  icon: TrendingUp,
                  label: "Weighted",
                  value: formatEur(goal.weightedEur),
                  sub: "Forecast",
                  tip: "Each deal amount × category weight (Upside 55%, Pipeline 25%, Not forecasted 8%, etc.).",
                },
                {
                  icon: Target,
                  label: "Gap",
                  value: formatEur(goal.gapEur),
                  sub: "To target",
                  tip: "Remaining weighted € to reach the monthly goal.",
                },
                {
                  icon: Calendar,
                  label: "Days left",
                  value: String(goal.daysLeft),
                  sub: "In month",
                  tip: "",
                },
              ] as const
            ).map((item) => (
              <div key={item.label} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3">
                <div className="flex items-start justify-between gap-1 mb-1">
                  <item.icon className="w-4 h-4 text-slate-600" />
                  {item.tip ? (
                    <button
                      type="button"
                      title={item.tip}
                      className="text-slate-400 hover:text-slate-700 p-0.5 shrink-0"
                      aria-label={`What is ${item.label}?`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="text-lg font-semibold text-slate-900 tabular-nums">{item.value}</p>
                <p className="text-[10px] text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Per-deal forecast and edits: use HubSpot · This page reflects the last spreadsheet export only.
          </p>

          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-700">Chance to hit {formatEur(goal.targetEur)}</p>
              <p className={`text-2xl font-bold ${chance.color}`}>
                ~{goal.winChancePct}% · {chance.label}
              </p>
            </div>
            <p className="text-xs text-slate-500 max-w-xs">
              Based on closed revenue + weighted upside deals closing this month. One upside win (e.g. Glam AI)
              likely gets you there.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
