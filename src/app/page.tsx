import LandingHero from "@/components/landing-hero";
import ExecutiveSummary from "@/components/executive-summary";
import GoalTracker from "@/components/goal-tracker";
import PipelineTrendChart from "@/components/pipeline-trend-chart";
import PriorityDeals from "@/components/priority-deals";
import PipelineHealthPanel from "@/components/pipeline-health";
import DealsTable from "@/components/deals-table";
import type { PipelineData } from "@/lib/pipeline-types";
import pipelineData from "../../public/data/pipeline.json";

const data = pipelineData as PipelineData;

export default function HomePage() {
  const siteUrl =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "https://victorhgutierrez-cloud.github.io/victorgutierrezforecastcontrol/";

  return (
    <main className="min-h-screen bg-[#030712] text-slate-100">
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.16),transparent),radial-gradient(ellipse_55%_40%_at_100%_0%,rgba(52,211,153,0.06),transparent)]"
      />

      <div className="relative z-10 max-w-6xl mx-auto pb-20">
        <LandingHero meta={data.meta} />

        <div className="px-4 space-y-10 pt-8">
          <ExecutiveSummary bullets={data.executiveBullets} />

          <section className="space-y-3">
            <h2 className="section-heading text-slate-200">Monthly goal &amp; forecast</h2>
            <p className="text-sm text-slate-500 mb-4">
              Close-date view for this calendar month; weights reflect HubSpot forecast category.
            </p>
            <GoalTracker goal={data.goal} />
          </section>

          <section className="space-y-3">
            <h2 className="section-heading text-slate-200">Momentum &amp; focus deals</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PipelineTrendChart goal={data.goal} />
              </div>
              <PriorityDeals goal={data.goal} meta={data.meta} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="section-heading text-slate-200">Pipeline health</h2>
            <p className="text-sm text-slate-500 mb-2">
              Create-date and activity signals — who to unblock before the close week.
            </p>
            <PipelineHealthPanel health={data.pipelineHealth} meta={data.meta} />
          </section>

          <section>
            <DealsTable deals={data.deals} />
          </section>
        </div>

        <footer className="mt-16 px-4 pb-12 space-y-4 text-center border-t border-white/10 pt-10">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest">Update checklist</p>
          <ol className="text-xs text-slate-400 space-y-1 max-w-xl mx-auto text-left list-decimal list-inside">
            <li>Export Forecast Control from HubSpot (xlsx).</li>
            <li>
              Replace the file in repo, run <code className="text-indigo-300">npm run generate-data</code>
              .
            </li>
            <li>
              <code className="text-indigo-300">git add .</code>, commit, push — GitHub Actions
              republishes the site (~3–5 min).
            </li>
          </ol>
          <p className="text-xs text-slate-600 max-w-xl mx-auto">
            Official forecast and deal edits remain in HubSpot. This dashboard is the weekly briefing
            link for 1:1s.
          </p>
          <a
            href={siteUrl}
            className="text-xs text-indigo-400/80 hover:text-indigo-300 break-all inline-block"
          >
            {siteUrl}
          </a>
          <p className="text-[11px] text-slate-600">{data.meta.source}</p>
        </footer>
      </div>
    </main>
  );
}
