"use client";

import BriefBentoSection from "@/components/brief-bento-section";
import DealsTable from "@/components/deals-table";
import GoalTracker from "@/components/goal-tracker";
import LandingHero from "@/components/landing-hero";
import MonthlyQuotaControl from "@/components/monthly-quota-control";
import { MonthlyQuotaProvider, useMonthlyQuota } from "@/components/monthly-quota-context";
import PipelineHealthPanel from "@/components/pipeline-health";
import PriorityDeals from "@/components/priority-deals";
import type { PipelineData } from "@/lib/pipeline-types";

function DashboardBody({
  pipelineData,
  siteUrl,
}: {
  pipelineData: PipelineData;
  siteUrl: string;
}) {
  const { executiveBullets, effectiveGoal } = useMonthlyQuota();

  return (
    <>
      <div className="px-4 space-y-12 pt-8">
        <BriefBentoSection
          bullets={executiveBullets}
          countries={pipelineData.summary.countries}
          goal={effectiveGoal}
          pipelineHealth={pipelineData.pipelineHealth}
        />

        <section className="space-y-3">
          <h2 className="section-heading text-slate-600">Monthly goal &amp; forecast</h2>
          <p className="text-sm text-slate-500 mb-4">
            Close-date view for this calendar month; weights reflect HubSpot forecast category.
          </p>
          <MonthlyQuotaControl />
          <div className="mt-6">
            <GoalTracker goal={effectiveGoal} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="section-heading text-slate-600">Focus deals</h2>
          <p className="text-sm text-slate-500 mb-4">
            Highest-impact open deals for the monthly target — drill into HubSpot from each row.
          </p>
          <PriorityDeals goal={effectiveGoal} meta={pipelineData.meta} />
        </section>

        <section className="space-y-3">
          <h2 className="section-heading text-slate-600">Pipeline health</h2>
          <p className="text-sm text-slate-500 mb-2">
            Create-date and activity signals — who to unblock before the close week.
          </p>
          <PipelineHealthPanel health={pipelineData.pipelineHealth} meta={pipelineData.meta} />
        </section>

        <section>
          <DealsTable deals={pipelineData.deals} />
        </section>
      </div>

      <footer className="mt-16 px-4 pb-12 space-y-4 text-center border-t border-slate-200 pt-10 bg-white">
        <p className="text-[11px] text-slate-500 uppercase tracking-widest">Update checklist</p>
        <ol className="text-xs text-slate-600 space-y-1 max-w-xl mx-auto text-left list-decimal list-inside">
          <li>Export Forecast Control from HubSpot (xlsx).</li>
          <li>
            Replace the file in repo, run{" "}
            <code className="text-blue-700 bg-blue-50 px-1 rounded">npm run generate-data</code>
            .
          </li>
          <li>
            <code className="text-blue-700 bg-blue-50 px-1 rounded">git add .</code>, commit, push — GitHub Actions
            republishes the site (~3–5 min).
          </li>
        </ol>
        <p className="text-xs text-slate-500 max-w-xl mx-auto">
          Official forecast and deal edits remain in HubSpot. This dashboard is the weekly briefing link for 1:1s.
          Use <strong className="font-medium">Monthly quota</strong> above for what-if simulations; regenerate data after
          changing <code className="text-xs">monthlyQuotaEur</code> in{" "}
          <code className="text-xs">dashboard-config.json</code> so the spreadsheet export aligns.
        </p>
        <a
          href={siteUrl}
          className="text-xs text-blue-700 hover:text-blue-900 break-all inline-block underline-offset-4 hover:underline"
        >
          {siteUrl}
        </a>
        <p className="text-[11px] text-slate-400">{pipelineData.meta.source}</p>
      </footer>
    </>
  );
}

export default function ForecastDashboardShell({
  pipelineData,
  siteUrl,
}: {
  pipelineData: PipelineData;
  siteUrl: string;
}) {
  return (
    <MonthlyQuotaProvider pipelineData={pipelineData}>
      <main className="min-h-screen bg-background text-foreground">
        <div className="relative z-10 max-w-7xl mx-auto pb-20">
          <LandingHero meta={pipelineData.meta} />
          <DashboardBody pipelineData={pipelineData} siteUrl={siteUrl} />
        </div>
      </main>
    </MonthlyQuotaProvider>
  );
}
