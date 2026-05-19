import type { ChartSeries, MonthlyGoal, PipelineDeal, PipelineSummary } from "@/lib/pipeline-types";

export const REPORT_CHART_COLORS = ["#0d9488", "#12a594", "#2563eb", "#64748b", "#f59e0b", "#8b5cf6"] as const;

type ChartPayload = {
  data: Record<string, string | number>[];
  categories: string[];
  index: string;
};

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

/** Weekly secured / weighted / trend from goal.trend */
export function buildMomentumChartData(goal: MonthlyGoal): ChartPayload {
  return {
    index: "Week",
    categories: ["Secured", "Weighted", "Trend"],
    data: goal.trend.map((t) => ({
      Week: t.week,
      Secured: Math.round(t.secured),
      Weighted: Math.round(t.weighted),
      Trend: Math.round(t.trend),
    })),
  };
}

/** Close-date pipeline € by forecast category per month (from export chartSeries). */
export function buildCloseMonthCategoryChart(
  chartSeries: ChartSeries[],
  chartMonths: string[],
): ChartPayload {
  const categories = chartSeries.map((s) => s.key);
  const data = chartMonths.map((monthKey) => {
    const row: Record<string, string | number> = { Month: monthLabel(monthKey) };
    for (const series of chartSeries) {
      const point = series.data.find((p) => String(p.key).startsWith(monthKey));
      row[series.key] = point ? Math.round(point.data) : 0;
    }
    return row;
  });
  return { index: "Month", categories, data };
}

/** Total pipeline € by HubSpot category (all deals in export). */
export function buildCategoryTotalsChart(summary: PipelineSummary): ChartPayload {
  return {
    index: "View",
    categories: ["Upside", "Pipeline", "Closed Won", "Not forecasted"],
    data: [
      {
        View: "All deals",
        Upside: Math.round(summary.upsideValue),
        Pipeline: Math.round(summary.pipelineValue),
        "Closed Won": Math.round(summary.closedWonValue),
        "Not forecasted": Math.round(summary.notForecastedValue),
      },
    ],
  };
}

/** Open pipeline € by country (top N, excludes Closed Won). */
export function buildCountryOpenPipelineChart(deals: PipelineDeal[], topN = 6): ChartPayload {
  const totals = new Map<string, number>();
  for (const d of deals) {
    if (d.category === "Closed Won") continue;
    const country = d.country?.trim() || "Unknown";
    totals.set(country, (totals.get(country) ?? 0) + d.amount);
  }
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
  const row: Record<string, string | number> = { Region: "Open pipeline" };
  for (const [country, amount] of sorted) {
    row[country] = Math.round(amount);
  }
  return {
    index: "Region",
    categories: sorted.map(([c]) => c),
    data: [row],
  };
}

/** Current-quarter close pipeline — by category (close date in quarter). */
export function buildCurrentQuarterCloseChart(deals: PipelineDeal[], quarterKey: string): ChartPayload {
  const catMap: { key: string; label: string }[] = [
    { key: "Upside", label: "Upside" },
    { key: "Pipeline", label: "Pipeline" },
    { key: "Closed Won", label: "Closed Won" },
    { key: "Closed Lost", label: "Closed Lost" },
    { key: "Not Forecasted", label: "Not forecasted" },
  ];
  const row: Record<string, string | number> = { Period: quarterKey.replace("-Q", " Q") };
  for (const { key, label } of catMap) {
    const sum = deals
      .filter((d) => d.closeQuarterKey === quarterKey && d.category === key)
      .reduce((acc, d) => acc + d.amount, 0);
    row[label] = Math.round(sum);
  }
  return {
    index: "Period",
    categories: catMap.map((c) => c.label),
    data: [row],
  };
}
