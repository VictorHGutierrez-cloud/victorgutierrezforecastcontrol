/**
 * Mirrors goal math + opening executive bullets from `scripts/generate-pipeline-data.py`
 * Keep in sync when changing Python formulas.
 */

import type { GoalTrendPoint, MonthlyGoal } from "@/lib/pipeline-types";

const MIN_DISPLAY_TARGET_EUR = 1;

/** Last day-of-month — same semantics as pandas MonthEnd normalize for current month. */
function daysInCalendarMonth(reference: Date): number {
  return new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
}

function deriveTrendWithUpdatedGoal(points: GoalTrendPoint[], goalLine: number): GoalTrendPoint[] {
  return points.map((pt) => ({ ...pt, goal: goalLine }));
}

/**
 * Recompute KPIs that scale with quota (target Eur) using current deal aggregates from pipeline.json.
 *
 * Mirrors lines ~164–174 and trend `goal` field in Python.
 */
export function deriveMonthlyGoalFromTarget(baseGoal: MonthlyGoal, targetEur: number, now: Date): MonthlyGoal {
  const tgt = Number.isFinite(targetEur) && targetEur > 0 ? targetEur : MIN_DISPLAY_TARGET_EUR;
  const weightedMonth = baseGoal.weightedEur;
  const secured = baseGoal.securedEur;

  const gap = Math.max(0, tgt - weightedMonth);
  const progressPct = Math.min(100, Math.round((weightedMonth / tgt) * 1000) / 10);
  const securedPct = Math.min(100, Math.round((secured / tgt) * 1000) / 10);
  const rawChance = (weightedMonth / tgt) * 72 + (secured / tgt) * 28;
  const winChancePct = Math.min(92, Math.max(8, Math.round(rawChance)));

  const daysInMonth = daysInCalendarMonth(now);
  const dayOfMonth = now.getDate();
  const runRate = dayOfMonth > 0 ? (secured / dayOfMonth) * daysInMonth : 0;
  const projectedMonth = Math.round(Math.min(runRate + weightedMonth - secured, tgt * 2));

  const trend = deriveTrendWithUpdatedGoal(baseGoal.trend, tgt);

  return {
    ...baseGoal,
    targetEur: tgt,
    gapEur: gap,
    progressPct,
    securedPct,
    winChancePct,
    projectedEur: projectedMonth,
    trend,
  };
}

/** Format like Python `:,` for decimals (rounded to int parts in bullets). */
function fmtIntEUR(n: number): string {
  return Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** First two bullets as in Python `generate-pipeline-data.py` ~277–281. */
export function buildExecutiveBulletsOpeningTwoLines(args: {
  monthlyGoalEur: number;
  progressPct: number;
  securedEur: number;
  weightedMonthEur: number;
  monthKey: string;
  gapEur: number;
  winChancePct: number;
}): [string, string] {
  const quota = fmtIntEUR(args.monthlyGoalEur);
  const pct = Math.round(args.progressPct);
  const secured = fmtIntEUR(args.securedEur);
  const weighted = fmtIntEUR(args.weightedMonthEur);
  const gap = fmtIntEUR(args.gapEur);
  const wc = Math.round(args.winChancePct);

  return [
    `Monthly goal €${quota}: ${pct}% by weighted forecast — €${secured} secured, €${weighted} weighted (${args.monthKey}).`,
    `Estimated chance to reach goal this month: ~${wc}%. Gap to target: €${gap}.`,
  ];
}

export function mergeExecutiveBulletsWhenQuotaAdjusted(
  exportedBullets: string[],
  regeneratedOpening: [string, string],
): string[] {
  const tail = exportedBullets.length > 2 ? exportedBullets.slice(2) : [];
  return [...regeneratedOpening, ...tail];
}
