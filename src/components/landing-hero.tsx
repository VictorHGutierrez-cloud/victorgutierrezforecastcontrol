"use client";

import { motion } from "framer-motion";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { PipelineMeta, PipelineSummary } from "@/lib/pipeline-types";
import { formatCurrency } from "@/lib/utils";

interface LandingHeroProps {
  meta: PipelineMeta;
  summary: PipelineSummary;
}

export default function LandingHero({ meta, summary }: LandingHeroProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-6xl mx-auto px-4 pt-12 pb-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 mb-6"
      >
        <Sparkles className="w-4 h-4" />
        Intelligent pipeline reporting
      </motion.div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl">
        {meta.owner}
      </h1>
      <p className="mt-3 text-xl text-slate-300">
        {meta.role} · Team <span className="text-indigo-400 font-semibold">{meta.team}</span>
      </p>

      <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-400">
        <span className="inline-flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2">
          <CalendarDays className="w-4 h-4 text-indigo-400" />
          Updated {meta.exportedAt}
        </span>
        <span className="inline-flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2">
          <MapPin className="w-4 h-4 text-indigo-400" />
          {summary.countries.length} markets · {summary.totalDeals} deals
        </span>
      </div>

      <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total pipeline", value: formatCurrency(summary.totalPipeline) },
          { label: "Upside", value: formatCurrency(summary.upsideValue) },
          { label: "In pipeline", value: formatCurrency(summary.pipelineValue) },
          { label: "Closed won", value: formatCurrency(summary.closedWonValue) },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="rounded-2xl border border-slate-700/80 bg-slate-900/50 p-4 backdrop-blur"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white font-mono">{kpi.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.header>
  );
}
