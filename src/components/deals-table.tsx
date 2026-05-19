"use client";

import { motion } from "framer-motion";
import type { PipelineDeal } from "@/lib/pipeline-types";
import { formatCurrency } from "@/lib/utils";

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
      transition={{ delay: 0.3, duration: 0.5 }}
      className="w-full max-w-6xl mx-auto px-4 pb-16"
    >
      <h2 className="text-2xl font-bold text-white mb-2">Deal intelligence</h2>
      <p className="text-slate-400 text-sm mb-6">
        Top opportunities from your HubSpot Forecast Control export, sorted by amount.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-900/40 backdrop-blur">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
              <th className="p-4 font-medium">Deal</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium hidden md:table-cell">Category</th>
              <th className="p-4 font-medium hidden lg:table-cell">Stage</th>
              <th className="p-4 font-medium hidden sm:table-cell">Country</th>
              <th className="p-4 font-medium hidden xl:table-cell">Close</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr
                key={deal.id}
                className="border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors"
              >
                <td className="p-4">
                  <p className="font-medium text-white line-clamp-2">{deal.name}</p>
                  {deal.partner && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">via {deal.partner}</p>
                  )}
                </td>
                <td className="p-4 font-mono text-indigo-300 whitespace-nowrap">
                  {formatCurrency(deal.amount)}
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${
                      CATEGORY_STYLES[deal.category] ?? CATEGORY_STYLES["Not Forecasted"]
                    }`}
                  >
                    {deal.category}
                  </span>
                </td>
                <td className="p-4 text-slate-400 hidden lg:table-cell max-w-[200px] truncate">
                  {deal.stage}
                </td>
                <td className="p-4 text-slate-400 hidden sm:table-cell whitespace-nowrap">
                  {deal.country}
                </td>
                <td className="p-4 text-slate-500 hidden xl:table-cell whitespace-nowrap">
                  {deal.closeDate
                    ? new Date(deal.closeDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
