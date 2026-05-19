"use client";

import { motion } from "framer-motion";
import type { PipelineMeta } from "@/lib/pipeline-types";

interface LandingHeroProps {
  meta: PipelineMeta;
}

export default function LandingHero({ meta }: LandingHeroProps) {
  return (
    <header className="w-full max-w-6xl mx-auto px-4 pt-10 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <motion.div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/90 mb-2">
            {meta.team} · Forecast Control
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {meta.owner}
          </h1>
          <p className="mt-1 text-slate-400">{meta.role}</p>
        </motion.div>
        <p className="text-sm text-slate-500 tabular-nums">
          HubSpot export · {meta.exportedAt}
        </p>
      </motion.div>
    </header>
  );
}
