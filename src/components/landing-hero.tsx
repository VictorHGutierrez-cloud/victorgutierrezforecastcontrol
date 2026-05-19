"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { PipelineMeta } from "@/lib/pipeline-types";
import { cn, formatDisplayDate } from "@/lib/utils";

interface LandingHeroProps {
  meta: PipelineMeta;
}

export default function LandingHero({ meta }: LandingHeroProps) {
  const title = meta.briefTitle || `${meta.team} Pipeline Brief`;
  const hubHref = meta.hubspotForecastUrl?.trim();

  return (
    <header className="w-full px-4 pt-10 pb-8 border-b border-white/10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
          Forecast lives in HubSpot · Weekly exec snapshot for 1:1s
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <motion.div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {title} · {meta.owner}
            </h1>
            <p className="mt-2 text-slate-400">{meta.role}</p>
          </motion.div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:justify-end">
            <p className="text-sm text-slate-500 whitespace-nowrap tabular-nums">
              Updated {formatDisplayDate(meta.exportedAt)}
            </p>
            {hubHref ? (
              <a
                href={hubHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium",
                  "bg-indigo-500 text-white hover:bg-indigo-400 transition-colors",
                )}
              >
                Open Forecast in HubSpot
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            ) : null}
          </div>
        </div>
      </motion.div>
    </header>
  );
}
