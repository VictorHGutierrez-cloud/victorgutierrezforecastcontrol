"use client";

import BriefBentoSection from "@/components/brief-bento-section";
import DealsTable from "@/components/deals-table";
import GoalTracker from "@/components/goal-tracker";
import LandingHero from "@/components/landing-hero";
import MonthlyQuotaControl from "@/components/monthly-quota-control";
import { MonthlyQuotaProvider, useMonthlyQuota } from "@/components/monthly-quota-context";
import PipelineHealthPanel from "@/components/pipeline-health";
import PipelineReportsSection from "@/components/pipeline-reports-section";
import PriorityDeals from "@/components/priority-deals";
import type { PipelineData } from "@/lib/pipeline-types";

function DashboardBody({ pipelineData }: { pipelineData: PipelineData }) {
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
          <PipelineReportsSection pipelineData={pipelineData} goal={effectiveGoal} />
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
          <DealsTable deals={pipelineData.deals} meta={pipelineData.meta} />
        </section>
      </div>
    </>
  );
}

export default function ForecastDashboardShell({ pipelineData }: { pipelineData: PipelineData }) {
  return (
    <MonthlyQuotaProvider pipelineData={pipelineData}>
      <main className="min-h-screen bg-background text-foreground">
        <div className="relative z-10 max-w-7xl mx-auto pb-20">
          <LandingHero meta={pipelineData.meta} />
          <DashboardBody pipelineData={pipelineData} />
        </div>
      </main>
    </MonthlyQuotaProvider>
  );
}
