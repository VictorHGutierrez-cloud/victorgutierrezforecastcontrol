import LandingHero from "@/components/landing-hero";
import GoalTracker from "@/components/goal-tracker";
import PipelineTrendChart from "@/components/pipeline-trend-chart";
import PriorityDeals from "@/components/priority-deals";
import DealsTable from "@/components/deals-table";
import type { PipelineData } from "@/lib/pipeline-types";
import pipelineData from "../../public/data/pipeline.json";

const data = pipelineData as PipelineData;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#030712] text-slate-100">
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(52,211,153,0.08),transparent)]"
      />
      <div className="relative z-10 max-w-6xl mx-auto pb-16">
        <LandingHero meta={data.meta} />

        <div className="px-4 space-y-6">
          <GoalTracker goal={data.goal} />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PipelineTrendChart goal={data.goal} />
            </div>
            <PriorityDeals goal={data.goal} />
          </div>

          <DealsTable deals={data.deals} />
        </div>

        <footer className="text-center text-xs text-slate-600 mt-12 px-4">
          <a
            href="https://victorhgutierrez-cloud.github.io/victorgutierrezforecastcontrol/"
            className="text-indigo-400/80 hover:text-indigo-300"
          >
            victorhgutierrez-cloud.github.io/victorgutierrezforecastcontrol
          </a>
          <p className="mt-2">{data.meta.source}</p>
        </footer>
      </div>
    </main>
  );
}
