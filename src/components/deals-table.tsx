"use client";

import { motion } from "framer-motion";
import type { PipelineDeal } from "@/lib/pipeline-types";
import { formatDisplayDate, formatEur } from "@/lib/utils";

const CATEGORY_STYLES: Record<string, string> = {
  Upside: "bg-blue-50 text-blue-800 border-blue-100",
  Pipeline: "bg-violet-50 text-violet-800 border-violet-100",
  "Closed Won": "bg-teal-50 text-teal-800 border-teal-100",
  "Not Forecasted": "bg-slate-100 text-slate-700 border-slate-200",
};

interface DealsTableProps {
  deals: PipelineDeal[];
}

export default function DealsTable({ deals }: DealsTableProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Full pipeline snapshot</h2>
      <p className="text-slate-500 text-sm mb-6">
        Sorted by current-month close first, then weighted contribution. Numbers from export.
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
              <th className="py-3 pl-4 pr-2 font-medium">Deal</th>
              <th className="p-3 font-medium tabular-nums">Amount</th>
              <th className="p-3 font-medium tabular-nums hidden sm:table-cell">Weighted</th>
              <th className="p-3 font-medium hidden md:table-cell">Category</th>
              <th className="p-3 font-medium tabular-nums hidden lg:table-cell">Score</th>
              <th className="p-3 font-medium tabular-nums hidden lg:table-cell">Touches</th>
              <th className="p-3 font-medium tabular-nums hidden xl:table-cell">Age</th>
              <th className="p-3 font-medium hidden 2xl:table-cell">Close</th>
              <th className="py-3 pl-3 pr-4 font-medium hidden md:table-cell">Country</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal, i) => (
              <tr
                key={deal.id}
                className={`border-b border-slate-100 transition-colors ${
                  i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                } hover:bg-blue-50/40`}
              >
                <td className="py-3 pl-4 pr-2">
                  <p className="font-medium text-slate-900 line-clamp-2">{deal.name}</p>
                  {deal.partner && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">via {deal.partner}</p>
                  )}
                  {deal.engagementRisk && (
                    <p className="text-[10px] text-amber-800 mt-1 font-medium">Low engagement signal</p>
                  )}
                </td>
                <td className="p-3 font-mono text-slate-800 tabular-nums whitespace-nowrap">
                  {formatEur(deal.amount)}
                </td>
                <td className="p-3 hidden sm:table-cell font-mono text-teal-800 tabular-nums whitespace-nowrap">
                  {formatEur(deal.weightedAmount)}
                </td>
                <td className="p-3 hidden md:table-cell align-top">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-[11px] ${
                      CATEGORY_STYLES[deal.category] ?? CATEGORY_STYLES["Not Forecasted"]
                    }`}
                  >
                    {deal.category}
                  </span>
                </td>
                <td className="p-3 text-slate-600 tabular-nums hidden lg:table-cell whitespace-nowrap">
                  {deal.dealScore != null ? (
                    <span
                      className={
                        deal.dealScore >= 70
                          ? "text-teal-800 font-medium"
                          : deal.dealScore >= 40
                            ? "text-slate-700"
                            : "text-amber-800 font-medium"
                      }
                    >
                      {Math.round(deal.dealScore)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-slate-600 tabular-nums hidden lg:table-cell whitespace-nowrap">
                  {deal.validTouchpoints != null ? deal.validTouchpoints : "—"}
                </td>
                <td className="p-3 text-slate-600 tabular-nums hidden xl:table-cell whitespace-nowrap">
                  {deal.ageDays}d
                </td>
                <td className="p-3 text-slate-600 hidden 2xl:table-cell whitespace-nowrap tabular-nums">
                  {formatDisplayDate(deal.closeDate ?? undefined)}
                </td>
                <td className="py-3 pl-3 pr-4 text-slate-600 hidden md:table-cell">{deal.country}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
