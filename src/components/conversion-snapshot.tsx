"use client";

import type { ConversionSnapshot as ConversionSnapshotProps } from "@/lib/pipeline-types";

interface ConversionSnapshotBannerProps {
  snapshot: ConversionSnapshotProps;
}

/** Conversion % and average closed-won cycle; excludes Deal Stage rows containing «First Demo» (computed in Python). */
export default function ConversionSnapshotBanner({ snapshot }: ConversionSnapshotBannerProps) {
  const rate =
    snapshot.ratePct != null && snapshot.funnelCount > 0
      ? `${snapshot.ratePct.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`
      : "—";
  const cycle =
    snapshot.avgSalesCycleDays != null && snapshot.cycleSampleCount > 0
      ? `${snapshot.avgSalesCycleDays.toLocaleString("en-GB", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        })} dias`
      : "—";

  return (
    <section
      className="border border-slate-200 rounded-xl bg-white shadow-sm px-4 py-4 sm:px-6"
      aria-label="Conversion and sales cycle"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Taxa de conversão (snapshot)
          </p>
          <p className="text-3xl font-semibold tabular-nums text-slate-900">{rate}</p>
          <p className="text-xs text-slate-500 mt-2 leading-snug">
            Ganhos ÷ <span className="font-medium text-slate-700">(Ganhos + Upside + Pipeline)</span>.
            Deals em estágio <span className="font-medium">&quot;First Demo&quot;</span> estão{" "}
            <span className="font-medium">excluídos</span>.
            {snapshot.ratePct != null ? (
              <span className="block mt-1 text-slate-600">
                {snapshot.wonCount} ganhos / {snapshot.funnelCount} no funil incluídos.
              </span>
            ) : (
              <span className="block mt-1">Sem deals no funil (após filtros).</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Ciclo médio de vendas
          </p>
          <p className="text-3xl font-semibold tabular-nums text-slate-900">{cycle}</p>
          <p className="text-xs text-slate-500 mt-2 leading-snug">
            Dias entre data de criação e data de fecho nos <span className="font-medium">Closed Won</span> já fora do
            First Demo. Usa a coluna HubSpot &quot;Time Between Creation and Closed Date&quot; quando existe; caso
            contrário calculemos pela diferença de datas.
            {snapshot.cycleSampleCount > 0 ? (
              <span className="block mt-1 text-slate-600">
                Base: {snapshot.cycleSampleCount} deal(s) fechados ganhos.
              </span>
            ) : (
              <span className="block mt-1 text-slate-600">Sem amostras de ganhos neste export.</span>
            )}
          </p>
        </div>
      </div>
      {snapshot.firstDemoExcludedDealCount > 0 ? (
        <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
          {snapshot.firstDemoExcludedDealCount} deal(s) omitidos pelo filtro First Demo neste snapshot.
        </p>
      ) : (
        <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
          Nenhum deal com texto &quot;First Demo&quot; no estágio neste export.
        </p>
      )}
    </section>
  );
}
