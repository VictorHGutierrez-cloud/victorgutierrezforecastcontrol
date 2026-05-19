"use client";

import type { QuarterOutlookRow } from "@/lib/pipeline-types";
import { formatEur } from "@/lib/utils";

interface QuarterOutlookSectionProps {
  rows: QuarterOutlookRow[];
}

export default function QuarterOutlookSection({ rows }: QuarterOutlookSectionProps) {
  if (!rows.length) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Quarter forecast outlook</h2>
        <p className="text-sm text-slate-500 mt-1">
          Secured and weighted pipeline by close quarter · losses use Closed lost stage date.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <th className="py-2.5 pl-4 pr-2 font-medium text-slate-600">Quarter</th>
              <th className="py-2.5 px-2 font-medium text-slate-600 tabular-nums">Target</th>
              <th className="py-2.5 px-2 font-medium text-slate-600 tabular-nums">Secured</th>
              <th className="py-2.5 px-2 font-medium text-slate-600 tabular-nums">Weighted</th>
              <th className="py-2.5 px-2 font-medium text-slate-600 tabular-nums">Closed lost</th>
              <th className="py-2.5 pr-4 pl-2 font-medium text-slate-600 tabular-nums">Open wt.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.quarter}
                className={`border-b border-slate-100 last:border-0 ${
                  row.isCurrent ? "bg-teal-50/50" : "bg-white"
                }`}
              >
                <td className="py-3 pl-4 pr-2 font-medium text-slate-900">
                  {row.label}
                  {row.isCurrent ? (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-teal-700 font-semibold">
                      Current
                    </span>
                  ) : null}
                </td>
                <td className="py-3 px-2 tabular-nums text-slate-700">{formatEur(row.targetEur)}</td>
                <td className="py-3 px-2 tabular-nums text-teal-800 font-medium">
                  {formatEur(row.securedEur)}
                </td>
                <td className="py-3 px-2 tabular-nums text-blue-800">{formatEur(row.weightedEur)}</td>
                <td className="py-3 px-2 tabular-nums text-rose-700">
                  {row.lostEur > 0 ? formatEur(row.lostEur) : "—"}
                </td>
                <td className="py-3 pr-4 pl-2 tabular-nums text-slate-600">
                  {formatEur(row.openWeightedEur)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
