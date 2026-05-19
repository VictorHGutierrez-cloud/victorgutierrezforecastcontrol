"use client";

import {
  QUOTA_SLIDER_STEP_EUR,
  quotaClamp,
  quotaSliderBounds,
  useMonthlyQuota,
} from "@/components/monthly-quota-context";

export default function MonthlyQuotaControl() {
  const { quotaEur, setQuotaEur, resetToExported, exportedTargetEur, hasQuotaOverrideVsExport } =
    useMonthlyQuota();
  const { minEur, maxEur } = quotaSliderBounds(exportedTargetEur);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">Monthly quota</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Move the slider to simulate a different € target · KPIs and the first executive bullets update instantly.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Value from spreadsheet export:&nbsp;
            <span className="font-semibold tabular-nums text-slate-700">
              {exportedTargetEur.toLocaleString("de-DE", { maximumFractionDigits: 0 })} €
            </span>
            {hasQuotaOverrideVsExport ? (
              <span className="ml-2 text-blue-700">(adjusted in browser)</span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-slate-700 border border-slate-300 rounded-md px-3 py-2 bg-white hover:bg-slate-50"
          onClick={resetToExported}
        >
          Reset to export
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">Range</span>
          <input
            type="range"
            min={minEur}
            max={maxEur}
            step={QUOTA_SLIDER_STEP_EUR}
            value={quotaEur}
            onChange={(e) => setQuotaEur(Number(e.target.value))}
            className="w-full accent-slate-900"
            aria-valuemin={minEur}
            aria-valuemax={maxEur}
            aria-valuenow={quotaEur}
          />
        </label>

        <label className="flex flex-col gap-1 shrink-0 w-full sm:w-36">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">Exact €</span>
          <input
            type="number"
            min={minEur}
            max={maxEur}
            step={QUOTA_SLIDER_STEP_EUR}
            value={quotaEur}
            onChange={(e) => {
              const next = quotaClamp(Number(e.target.value), exportedTargetEur);
              if (Number.isFinite(next)) setQuotaEur(next);
            }}
            className="tabular-nums w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 bg-white"
          />
        </label>
      </div>
    </div>
  );
}
