"use client";

import type { ConversionSnapshot } from "@/lib/pipeline-types";

interface ConversionSnapshotBannerProps {
  snapshot: ConversionSnapshot;
}

/** Conversion % and average closed-won cycle; excludes Deal Stage rows containing "First Demo" (computed in Python). */
export default function ConversionSnapshotBanner({ snapshot }: ConversionSnapshotBannerProps) {
  const rate =
    snapshot.ratePct != null && snapshot.funnelCount > 0
      ? `${snapshot.ratePct.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`
      : "—";
  const cycle =
    snapshot.avgSalesCycleDays != null && snapshot.cycleSampleCount > 0
      ? `${snapshot.avgSalesCycleDays.toLocaleString("en-GB", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        })} days`
      : "—";

  return (
    <section
      className="border border-slate-200 rounded-xl bg-white shadow-sm px-4 py-4 sm:px-6"
      aria-label="Conversion and sales cycle"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Conversion rate (snapshot)
          </p>
          <p className="text-3xl font-semibold tabular-nums text-slate-900">{rate}</p>
          <p className="text-xs text-slate-500 mt-2 leading-snug">
            Closed won ÷ <span className="font-medium text-slate-700">(Closed won + Upside + Pipeline)</span>.
            Deals in a stage containing <span className="font-medium">&quot;First Demo&quot;</span> are{" "}
            <span className="font-medium">excluded</span>.
            {snapshot.ratePct != null ? (
              <span className="block mt-1 text-slate-600">
                {snapshot.wonCount} won / {snapshot.funnelCount} in funnel.
              </span>
            ) : (
              <span className="block mt-1">No deals in funnel after filters.</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Average sales cycle
          </p>
          <p className="text-3xl font-semibold tabular-nums text-slate-900">{cycle}</p>
          <p className="text-xs text-slate-500 mt-2 leading-snug">
            Days from create date to close date on <span className="font-medium">Closed Won</span> deals (excluding
            First Demo). Uses HubSpot column &quot;Time Between Creation and Closed Date&quot; when present; otherwise
            we compute from dates.
            {snapshot.cycleSampleCount > 0 ? (
              <span className="block mt-1 text-slate-600">
                Based on {snapshot.cycleSampleCount} closed-won deal(s).
              </span>
            ) : (
              <span className="block mt-1 text-slate-600">No closed-won samples in this export.</span>
            )}
          </p>
        </div>
      </div>
      {snapshot.firstDemoExcludedDealCount > 0 ? (
        <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
          {snapshot.firstDemoExcludedDealCount} deal(s) omitted by the First Demo stage filter in this snapshot.
        </p>
      ) : (
        <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
          No deals with &quot;First Demo&quot; in stage text in this export.
        </p>
      )}
    </section>
  );
}
