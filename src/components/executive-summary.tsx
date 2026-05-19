"use client";

import { motion } from "framer-motion";
import { ListChecks } from "lucide-react";

interface ExecutiveSummaryProps {
  bullets: string[];
  /** When true, omits outer card chrome (parent provides layout). */
  embedded?: boolean;
}

export default function ExecutiveSummary({ bullets, embedded }: ExecutiveSummaryProps) {
  const content = (
    <>
      <div className={`flex items-center gap-2 ${embedded ? "mb-3" : "mb-4"}`}>
        <ListChecks className={`shrink-0 text-slate-600 ${embedded ? "w-4 h-4" : "w-5 h-5"}`} />
        <h2 className={`font-semibold text-slate-900 ${embedded ? "text-base" : "text-lg"}`}>
          Executive summary
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Generated from last export · Pair with HubSpot for live forecast changes.
      </p>
      <ul className={`space-y-3 ${embedded ? "space-y-2.5" : ""}`}>
        {bullets.map((line, i) => (
          <li
            key={i}
            className={`flex gap-3 text-sm text-slate-700 leading-relaxed border-l-2 border-slate-300 pl-3`}
          >
            <span className="text-slate-400 shrink-0 w-5 tabular-nums text-xs font-medium">{i + 1}.</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </>
  );

  if (embedded) {
    return <div>{content}</div>;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {content}
    </motion.section>
  );
}
