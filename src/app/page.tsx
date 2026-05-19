import LandingHero from "@/components/landing-hero";
import DealsTable from "@/components/deals-table";
import PipelineForecastReport from "@/components/ui/pipeline-forecast-report";
import type { PipelineData } from "@/lib/pipeline-types";
import pipelineData from "../../public/data/pipeline.json";

const data = pipelineData as PipelineData;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070b14]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(49,46,129,0.35)_0%,#070b14_55%)] pointer-events-none"
      />
      <div className="relative z-10">
        <LandingHero meta={data.meta} summary={data.summary} />

        <section className="w-full max-w-6xl mx-auto px-4 pb-12 flex flex-col lg:flex-row gap-10 items-start justify-center">
          <PipelineForecastReport data={data} />

          <aside className="w-full max-w-md space-y-4 lg:pt-8">
            <h3 className="text-lg font-semibold text-white">Quick insights</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
                <strong className="text-indigo-300">{data.summary.upsideCount} upside deals</strong>{" "}
                represent {Math.round((data.summary.upsideValue / data.summary.totalPipeline) * 100)}
                % of your weighted pipeline ({data.summary.upsideValue.toLocaleString()} USD).
              </li>
              <li className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
                Largest opportunity:{" "}
                <strong className="text-white">{data.deals[0]?.name}</strong> at{" "}
                {data.deals[0]?.amount.toLocaleString()} USD.
              </li>
              <li className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
                {data.summary.notForecastedCount} deals are{" "}
                <strong className="text-slate-200">not yet forecasted</strong> — early-stage Angola
                partner motion with Fulton.
              </li>
              <li className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 text-slate-400">
                To refresh: export Forecast Control from HubSpot, replace the .xlsx file, run{" "}
                <code className="text-indigo-300 bg-slate-800 px-1 rounded">npm run generate-data</code>
                , then redeploy.
              </li>
            </ul>
          </aside>
        </section>

        <DealsTable deals={data.deals} />

        <footer className="text-center text-xs text-slate-600 pb-10">
          {data.meta.source} · {data.meta.owner} · Team {data.meta.team}
        </footer>
      </div>
    </main>
  );
}
