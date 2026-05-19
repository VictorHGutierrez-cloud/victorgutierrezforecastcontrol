/**
 * Mirrors goal math + opening executive bullets from `scripts/generate-pipeline-data.py`
 * Keep in sync when changing Python formulas.
 */

import type { GoalTrendPoint, MonthlyGoal } from "@/lib/pipeline-types";

const MIN_DISPLAY_TARGET_EUR = 1;

function daysInCalendarQuarter(reference: Date): number {
  const q = Math.floor(reference.getMonth() / 3);
  const start = new Date(reference.getFullYear(), q * 3, 1);
  const end = new Date(reference.getFullYear(), q * 3 + 3, 0);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function deriveTrendWithUpdatedGoal(points: GoalTrendPoint[], goalLine: number): GoalTrendPoint[] {
  return points.map((pt) => ({ ...pt, goal: goalLine }));
}

/**
 * Recompute KPIs that scale with quarterly quota using aggregates from pipeline.json.
 */
export function deriveMonthlyGoalFromTarget(baseGoal: MonthlyGoal, targetEur: number, now: Date): MonthlyGoal {
  const tgt = Number.isFinite(targetEur) && targetEur > 0 ? targetEur : MIN_DISPLAY_TARGET_EUR;
  const weighted = baseGoal.weightedEur;
  const secured = baseGoal.securedEur;

  const gapEur = Math.max(0, tgt - secured);
  const gapWeightedEur = Math.max(0, tgt - weighted);
  const progressPct = Math.min(100, Math.round((weighted / tgt) * 1000) / 10);
  const securedPct = Math.min(100, Math.round((secured / tgt) * 1000) / 10);
  const rawChance = (weighted / tgt) * 72 + (secured / tgt) * 28;
  const winChancePct = Math.min(92, Math.max(8, Math.round(rawChance)));

  const daysInQuarter = daysInCalendarQuarter(now);
  const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const qStart = new Date(now.getFullYear(), qStartMonth, 1);
  const daysElapsed = Math.max(1, Math.floor((now.getTime() - qStart.getTime()) / 86_400_000) + 1);
  const runRate = daysElapsed > 0 ? (secured / daysElapsed) * daysInQuarter : 0;
  const projectedEur = Math.round(Math.min(runRate + weighted - secured, tgt * 2));

  const trend = deriveTrendWithUpdatedGoal(baseGoal.trend, tgt);
  const monthlyTargetEur = Math.round(tgt / 3);

  return {
    ...baseGoal,
    targetEur: tgt,
    monthlyTargetEur,
    gapEur,
    gapWeightedEur,
    progressPct,
    securedPct,
    winChancePct,
    projectedEur,
    trend,
  };
}

function fmtIntEUR(n: number): string {
  return Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function buildExecutiveBulletsOpeningTwoLines(args: {
  quarterlyGoalEur: number;
  progressPct: number;
  securedEur: number;
  weightedMonthEur: number;
  monthKey: string;
  quarterLabel?: string;
  gapEur: number;
  gapWeightedEur: number;
  winChancePct: number;
}): [string, string] {
  const quarterly = fmtIntEUR(args.quarterlyGoalEur);
  const monthly = fmtIntEUR(args.quarterlyGoalEur / 3);
  const pct = Math.round(args.progressPct);
  const secured = fmtIntEUR(args.securedEur);
  const weighted = fmtIntEUR(args.weightedMonthEur);
  const gapSecured = fmtIntEUR(args.gapEur);
  const gapWeighted = fmtIntEUR(args.gapWeightedEur);
  const wc = Math.round(args.winChancePct);
  const period = args.quarterLabel ?? args.monthKey;

  return [
    `${period} goal €${quarterly} (€${monthly}/mo): ${pct}% by weighted forecast — €${secured} secured, €${weighted} weighted.`,
    `Estimated chance to reach ${period} goal: ~${wc}%. Gap to close (secured): €${gapSecured} · Gap with forecast: €${gapWeighted}.`,
  ];
}

export function mergeExecutiveBulletsWhenQuotaAdjusted(
  exportedBullets: string[],
  regeneratedOpening: [string, string],
): string[] {
  const tail = exportedBullets.length > 2 ? exportedBullets.slice(2) : [];
  return [...regeneratedOpening, ...tail];
}
