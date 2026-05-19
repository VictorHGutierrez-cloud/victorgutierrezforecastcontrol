"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";
import type { PipelineDeal, PipelineMeta } from "@/lib/pipeline-types";
import { formatDisplayDate, formatEur, hubspotDealUrl } from "@/lib/utils";

const CATEGORY_STYLES: Record<string, string> = {
  Upside: "bg-blue-50 text-blue-800 border-blue-100",
  Pipeline: "bg-violet-50 text-violet-800 border-violet-100",
  "Closed Won": "bg-teal-50 text-teal-800 border-teal-100",
  "Closed Lost": "bg-rose-50 text-rose-800 border-rose-100",
  "Not Forecasted": "bg-slate-100 text-slate-700 border-slate-200",
};

type SortKey =
  | "name"
  | "amount"
  | "weightedAmount"
  | "category"
  | "dealScore"
  | "validTouchpoints"
  | "ageDays"
  | "closeDate"
  | "closeLostStageDate"
  | "country";

type SortDir = "asc" | "desc";

const SORT_COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: "name", label: "Deal", className: "py-3 pl-4 pr-2 font-medium" },
  { key: "amount", label: "Amount", className: "p-3 font-medium tabular-nums" },
  { key: "weightedAmount", label: "Weighted", className: "p-3 font-medium tabular-nums hidden sm:table-cell" },
  { key: "category", label: "Category", className: "p-3 font-medium hidden md:table-cell" },
  { key: "dealScore", label: "Score", className: "p-3 font-medium tabular-nums hidden lg:table-cell" },
  { key: "validTouchpoints", label: "Touches", className: "p-3 font-medium tabular-nums hidden lg:table-cell" },
  { key: "ageDays", label: "Age", className: "p-3 font-medium tabular-nums hidden xl:table-cell" },
  { key: "closeDate", label: "Close", className: "p-3 font-medium hidden 2xl:table-cell" },
  {
    key: "closeLostStageDate",
    label: "Lost date",
    className: "p-3 font-medium hidden 2xl:table-cell",
  },
  { key: "country", label: "Country", className: "py-3 pl-3 pr-4 font-medium hidden md:table-cell" },
];

function compareNullableNum(
  a: number | null | undefined,
  b: number | null | undefined,
  dir: SortDir,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return dir === "asc" ? 1 : -1;
  if (b == null) return dir === "asc" ? -1 : 1;
  return a - b;
}

function compareNullableDate(
  a: string | null | undefined,
  b: string | null | undefined,
  dir: SortDir,
): number {
  if (!a && !b) return 0;
  if (!a) return dir === "asc" ? 1 : -1;
  if (!b) return dir === "asc" ? -1 : 1;
  return new Date(a).getTime() - new Date(b).getTime();
}

function compareDeals(a: PipelineDeal, b: PipelineDeal, key: SortKey, dir: SortDir): number {
  const mul = dir === "asc" ? 1 : -1;
  let cmp = 0;

  switch (key) {
    case "name":
      cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      break;
    case "amount":
      cmp = a.amount - b.amount;
      break;
    case "weightedAmount":
      cmp = a.weightedAmount - b.weightedAmount;
      break;
    case "category":
      cmp = a.category.localeCompare(b.category, undefined, { sensitivity: "base" });
      break;
    case "dealScore":
      cmp = compareNullableNum(a.dealScore, b.dealScore, dir);
      break;
    case "validTouchpoints":
      cmp = compareNullableNum(a.validTouchpoints, b.validTouchpoints, dir);
      break;
    case "ageDays":
      cmp = a.ageDays - b.ageDays;
      break;
    case "closeDate":
      cmp = compareNullableDate(a.closeDate, b.closeDate, dir);
      break;
    case "closeLostStageDate":
      cmp = compareNullableDate(a.closeLostStageDate, b.closeLostStageDate, dir);
      break;
    case "country":
      cmp = a.country.localeCompare(b.country, undefined, { sensitivity: "base" });
      break;
  }

  return cmp * mul;
}

interface DealsTableProps {
  deals: PipelineDeal[];
  meta: PipelineMeta;
}

function SortableHeader({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  className,
}: {
  label: string;
  column: SortKey;
  activeColumn: SortKey | null;
  direction: SortDir;
  onSort: (col: SortKey) => void;
  className?: string;
}) {
  const active = activeColumn === column;
  const SortIcon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      className={className}
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1 w-full text-left uppercase text-[10px] tracking-wider text-slate-500 hover:text-slate-900 transition-colors group"
      >
        <span>{label}</span>
        <SortIcon
          className={`w-3 h-3 shrink-0 ${active ? "text-blue-700" : "text-slate-400 opacity-40 group-hover:opacity-80"}`}
          aria-hidden
        />
      </button>
    </th>
  );
}

function DealNameCell({
  deal,
  href,
}: {
  deal: PipelineDeal;
  href: string | null;
}) {
  const flagged = deal.engagementRisk || deal.isStale;

  return (
    <td className="py-3 pl-4 pr-2">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`font-medium inline-flex items-start gap-1 line-clamp-2 hover:text-blue-700 ${
            flagged ? "text-amber-950" : "text-slate-900"
          }`}
        >
          <span>{deal.name}</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" aria-hidden />
        </a>
      ) : (
        <p className={`font-medium line-clamp-2 ${flagged ? "text-amber-950" : "text-slate-900"}`}>{deal.name}</p>
      )}
      {deal.partner && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">via {deal.partner}</p>}
      {deal.engagementRisk && (
        <p className="text-[10px] text-amber-800 mt-1 font-medium">Low engagement signal — open in HubSpot</p>
      )}
      {deal.isStale && !deal.engagementRisk && (
        <p className="text-[10px] text-amber-800 mt-1 font-medium">Needs attention — open in HubSpot</p>
      )}
      {deal.nextStep && flagged ? (
        <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">{deal.nextStep}</p>
      ) : null}
    </td>
  );
}

export default function DealsTable({ deals, meta }: DealsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedDeals = useMemo(() => {
    if (!sortKey) return deals;
    return [...deals].sort((a, b) => compareDeals(a, b, sortKey, sortDir));
  }, [deals, sortKey, sortDir]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Full pipeline snapshot</h2>
      <p className="text-slate-500 text-sm mb-6">
        Click a column header to sort A→Z (click again for Z→A). Deal names open the record in HubSpot.
      </p>

      <motion.div layout className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {SORT_COLUMNS.map((col) => (
                <SortableHeader
                  key={col.key}
                  label={col.label}
                  column={col.key}
                  activeColumn={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                  className={col.className}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedDeals.map((deal, i) => {
              const href = hubspotDealUrl(meta.hubspotPortalId, deal.id, meta.hubspotDealBaseOrigin);
              const flagged = deal.engagementRisk || deal.isStale;

              return (
                <tr
                  key={deal.id}
                  className={`border-b border-slate-100 transition-colors ${
                    flagged ? "bg-amber-50/50 hover:bg-amber-50" : i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                  } hover:bg-blue-50/40`}
                >
                  <DealNameCell deal={deal} href={href} />
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
                  <td className="p-3 text-slate-600 hidden 2xl:table-cell whitespace-nowrap tabular-nums">
                    {formatDisplayDate(deal.closeLostStageDate ?? undefined)}
                  </td>
                  <td className="py-3 pl-3 pr-4 text-slate-600 hidden md:table-cell">{deal.country}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </motion.section>
  );
}
