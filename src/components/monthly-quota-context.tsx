"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import type { MonthlyGoal, PipelineData } from "@/lib/pipeline-types";
import {
  buildExecutiveBulletsOpeningTwoLines,
  deriveMonthlyGoalFromTarget,
  mergeExecutiveBulletsWhenQuotaAdjusted,
} from "@/lib/derive-monthly-goal";

export const MONTHLY_QUOTA_STORAGE_KEY = "forecast-row-monthly-quota";

/** Default thumbs range; bounds widen to always include spreadsheet export quota. */
export const QUOTA_UI_DEFAULT_MIN_EUR = 1;
export const QUOTA_UI_DEFAULT_MAX_EUR = 50_000;
export const QUOTA_SLIDER_STEP_EUR = 1;

/** Keep quota quantization aligned with slider step — bounds include `exportedTarget`. */
export function quotaClamp(raw: number, exportedTargetEur: number): number {
  const low = Math.min(QUOTA_UI_DEFAULT_MIN_EUR, Math.max(1, exportedTargetEur));
  const high = Math.max(QUOTA_UI_DEFAULT_MAX_EUR, exportedTargetEur);
  if (!Number.isFinite(raw)) {
    raw = exportedTargetEur;
  }
  /** Exact export quota (often baked from dashboard-config) preserves parity with spreadsheet. */
  if (Math.abs(raw - exportedTargetEur) < 1e-6) {
    return Math.min(high, Math.max(low, exportedTargetEur));
  }
  const stepped = Math.round(raw / QUOTA_SLIDER_STEP_EUR) * QUOTA_SLIDER_STEP_EUR;
  return Math.min(high, Math.max(low, stepped));
}

/** Min/max sent to slider inputs (readable range). */
export function quotaSliderBounds(exportedTargetEur: number): { minEur: number; maxEur: number } {
  return {
    minEur: Math.min(QUOTA_UI_DEFAULT_MIN_EUR, Math.max(1, exportedTargetEur)),
    maxEur: Math.max(QUOTA_UI_DEFAULT_MAX_EUR, exportedTargetEur),
  };
}

type MonthlyQuotaContextValue = {
  quotaEur: number;
  setQuotaEur: (n: number) => void;
  resetToExported: () => void;
  exportedTargetEur: number;
  effectiveGoal: MonthlyGoal;
  executiveBullets: string[];
  /** True when current quota differs from the value baked into pipeline.json goal.targetEur. */
  hasQuotaOverrideVsExport: boolean;
};

const MonthlyQuotaContext = createContext<MonthlyQuotaContextValue | null>(null);

export function useMonthlyQuota(): MonthlyQuotaContextValue {
  const ctx = useContext(MonthlyQuotaContext);
  if (!ctx) {
    throw new Error("useMonthlyQuota must be used within MonthlyQuotaProvider");
  }
  return ctx;
}

type ProviderProps = { children: React.ReactNode; pipelineData: PipelineData };

export function MonthlyQuotaProvider({ children, pipelineData }: ProviderProps) {
  const exportedTargetEur = pipelineData.goal.targetEur;

  /** Initial render matches SSR / static export until effect applies LS + optional config quota. */
  const [quotaEur, setQuotaInternal] = useState(() =>
    quotaClamp(pipelineData.goal.targetEur, pipelineData.goal.targetEur),
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let configQuota: number | undefined;
      try {
        const res = await fetch("/data/dashboard-config.json", { cache: "no-store" });
        const j = (await res.json()) as { monthlyQuotaEur?: unknown };
        const mq = j.monthlyQuotaEur;
        const n =
          typeof mq === "number"
            ? mq
            : typeof mq === "string" && mq.trim()
              ? Number(String(mq).replace(/\s+/g, ""))
              : NaN;
        if (Number.isFinite(n) && n > 0) {
          configQuota = quotaClamp(n * 3, exportedTargetEur);
        }
      } catch {
        /**/
      }

      const fallbackFromChain = quotaClamp(configQuota ?? exportedTargetEur, exportedTargetEur);

      try {
        const raw =
          typeof window !== "undefined" ? window.localStorage.getItem(MONTHLY_QUOTA_STORAGE_KEY) : null;
        if (raw !== null && raw.trim() !== "") {
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) {
            const q = quotaClamp(parsed, exportedTargetEur);
            if (!cancelled) {
              setQuotaInternal(q);
            }
            return;
          }
        }
      } catch {
        /**/
      }

      if (!cancelled) {
        setQuotaInternal(fallbackFromChain);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exportedTargetEur]);

  const setQuotaEur = useCallback(
    (n: number) => {
      const q = quotaClamp(n, exportedTargetEur);
      setQuotaInternal(q);
      try {
        window.localStorage.setItem(MONTHLY_QUOTA_STORAGE_KEY, String(q));
      } catch {
        /**/
      }
    },
    [exportedTargetEur],
  );

  const resetToExported = useCallback(() => {
    const q = quotaClamp(exportedTargetEur, exportedTargetEur);
    setQuotaInternal(q);
    try {
      window.localStorage.removeItem(MONTHLY_QUOTA_STORAGE_KEY);
    } catch {
      /**/
    }
  }, [exportedTargetEur]);

  const effectiveGoal = useMemo(
    () => deriveMonthlyGoalFromTarget(pipelineData.goal, quotaEur, new Date()),
    [pipelineData.goal, quotaEur],
  );

  const hasQuotaOverrideVsExport = quotaEur !== exportedTargetEur;

  const executiveBullets = useMemo(() => {
    const base = pipelineData.executiveBullets;
    if (!hasQuotaOverrideVsExport) {
      return base;
    }

    const pair = buildExecutiveBulletsOpeningTwoLines({
      quarterlyGoalEur: quotaEur,
      progressPct: effectiveGoal.progressPct,
      securedEur: effectiveGoal.securedEur,
      weightedMonthEur: effectiveGoal.weightedEur,
      monthKey: effectiveGoal.month,
      quarterLabel: effectiveGoal.quarterLabel ?? effectiveGoal.monthLabel,
      gapEur: effectiveGoal.gapEur,
      gapWeightedEur: effectiveGoal.gapWeightedEur,
      winChancePct: effectiveGoal.winChancePct,
    });

    return mergeExecutiveBulletsWhenQuotaAdjusted(base, pair);
  }, [hasQuotaOverrideVsExport, pipelineData.executiveBullets, quotaEur, effectiveGoal]);

  const value = useMemo<MonthlyQuotaContextValue>(
    () => ({
      quotaEur,
      setQuotaEur,
      resetToExported,
      exportedTargetEur,
      effectiveGoal,
      executiveBullets,
      hasQuotaOverrideVsExport,
    }),
    [
      quotaEur,
      setQuotaEur,
      resetToExported,
      exportedTargetEur,
      effectiveGoal,
      executiveBullets,
      hasQuotaOverrideVsExport,
    ],
  );

  return (
    <MonthlyQuotaContext.Provider value={value}>{children}</MonthlyQuotaContext.Provider>
  );
}
