"use client";

import { motion } from "framer-motion";
import { ListChecks } from "lucide-react";

interface ExecutiveSummaryProps {
  bullets: string[];
}

export default function ExecutiveSummary({ bullets }: ExecutiveSummaryProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-semibold text-white">Executive summary</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Generated from last export · Use with HubSpot for live forecast changes.
      </p>
      <ul className="space-y-3">
        {bullets.map((line, i) => (
          <li
            key={i}
            className="flex gap-3 text-sm text-slate-300 leading-relaxed border-l-2 border-emerald-500/50 pl-3"
          >
            <span className="text-emerald-500/80 shrink-0 w-6 tabular-nums">{i + 1}.</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
