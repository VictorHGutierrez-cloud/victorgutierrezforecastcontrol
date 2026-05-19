"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, Wallet, Calendar } from "lucide-react";
import type { MonthlyGoal } from "@/lib/pipeline-types";
import { formatEur } from "@/lib/utils";

interface GoalTrackerProps {
  goal: MonthlyGoal;
}

function chanceLabel(pct: number): { label: string; color: string } {
  if (pct >= 75) return { label: "Strong", color: "text-emerald-400" };
  if (pct >= 50) return { label: "Moderate", color: "text-amber-400" };
  return { label: "At risk", color: "text-rose-400" };
}

export default function GoalTracker({ goal }: GoalTrackerProps) {
  const chance = chanceLabel(goal.winChancePct);
  const circumference = 2 * Math.PI * 88;
  const offset = circumference - (goal.progressPct / 100) * circumference;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40"
    >
      <motion.div className="flex flex-col lg:flex-row gap-8 items-center">
        <div className="relative shrink-0">
          <svg width="200" height="200" className="-rotate-90">
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="14"
            />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="url(#goalGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold text-white tabular-nums">
              {goal.progressPct}%
            </span>
            <span className="text-xs text-slate-400 mt-1">of monthly goal</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/90 mb-1">
              {goal.monthLabel} target
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <Target className="w-7 h-7 text-emerald-400" />
              {formatEur(goal.targetEur)} goal
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Wallet, label: "Secured", value: formatEur(goal.securedEur), sub: "Closed won" },
              { icon: TrendingUp, label: "Weighted", value: formatEur(goal.weightedEur), sub: "Forecast" },
              { icon: Target, label: "Gap", value: formatEur(goal.gapEur), sub: "To target" },
              { icon: Calendar, label: "Days left", value: String(goal.daysLeft), sub: "In month" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/5 border border-white/8 px-3 py-3"
              >
                <item.icon className="w-4 h-4 text-slate-400 mb-1" />
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="text-lg font-semibold text-white tabular-nums">{item.value}</p>
                <p className="text-[10px] text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-300">Chance to hit {formatEur(goal.targetEur)}</p>
              <p className={`text-2xl font-bold ${chance.color}`}>
                ~{goal.winChancePct}% · {chance.label}
              </p>
            </div>
            <p className="text-xs text-slate-400 max-w-xs">
              Based on closed revenue + weighted upside deals closing this month. One upside
              win (e.g. Glam AI) likely gets you there.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
