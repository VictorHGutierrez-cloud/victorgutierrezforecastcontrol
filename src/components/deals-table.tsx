"use client";

import { motion } from "framer-motion";
import type { PipelineDeal } from "@/lib/pipeline-types";
import { formatDisplayDate, formatEur } from "@/lib/utils";

const CATEGORY_STYLES: Record<string, string> = {
  Upside: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  Pipeline: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "Closed Won": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Not Forecasted": "bg-slate-500/20 text-slate-300 border-slate-500/30",
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
      className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl"
    >
      <h2 className="text-lg font-semibold text-white mb-1">Full pipeline snapshot</h2>
      <p className="text-slate-500 text-sm mb-6">
        Sorted by current-month close first, then weighted contribution. Numbers from export.
      </p>

      <div className="overflow-x-auto rounded-xl border border-white/8">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-500 uppercase text-[10px] tracking-wider">
              <th className="py-3 pl-4 pr-2 font-medium">Deal</th>
              <th className="p-3 font-medium tabular-nums">Amount</th>
              <th className="p-3 font-medium tabular-nums hidden sm:table-cell">Weighted</th>
              <th className="p-3 font-medium hidden md:table-cell">Category</th>
              <th className="p-3 font-medium tabular-nums hidden lg:table-cell">Age</th>
              <th className="p-3 font-medium hidden xl:table-cell">Close</th>
              <th className="py-3 pl-3 pr-4 font-medium hidden md:table-cell">Country</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal, i) => (
              <tr
                key={deal.id}
                className={`border-b border-white/5 transition-colors ${
                  i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                } hover:bg-white/[0.06]`}
              >
                <td className="py-3 pl-4 pr-2">
                  <p className="font-medium text-white line-clamp-2">{deal.name}</p>
                  {deal.partner && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">via {deal.partner}</p>
                  )}
                </td>
                <td className="p-3 font-mono text-slate-200 tabular-nums whitespace-nowrap">
                  {formatEur(deal.amount)}
                </td>
                <td className="p-3 hidden sm:table-cell font-mono text-emerald-400/90 tabular-nums whitespace-nowrap">
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
                <td className="p-3 text-slate-400 tabular-nums hidden lg:table-cell whitespace-nowrap">
                  {deal.ageDays}d
                </td>
                <td className="p-3 text-slate-400 hidden xl:table-cell whitespace-nowrap tabular-nums">
                  {formatDisplayDate(deal.closeDate ?? undefined)}
                </td>
                <td className="py-3 pl-3 pr-4 text-slate-400 hidden md:table-cell">
                  {deal.country}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
