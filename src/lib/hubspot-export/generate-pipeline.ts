import type { PipelineData, PipelineDeal } from "@/lib/pipeline-types";
import {
  CHART_CATEGORIES,
  type DashboardConfig,
} from "./constants";
import {
  catKey,
  daysBetween,
  daysLeftInQuarter,
  dealIsStale,
  exportColumnReport,
  isFirstDemoStage,
  isoOrNone,
  monthKeyFromDate,
  monthlyGoalFromConfig,
  parseDate,
  quarterCalendarMonths,
  quarterKeyFromDate,
  quarterKeyFromValue,
  quarterLabel,
  rowNextActivity,
  rowOptionalFields,
  safeFloat,
  safeInt,
  safeStr,
  staleReason,
  weightedAmount,
  type HubSpotRow,
} from "./helpers";
import { readHubSpotExportRows } from "./read-excel";

type EnrichedRow = HubSpotRow & {
  category_group: string;
  close_month: string;
  create_month: string;
  close_quarter: string;
  lost_quarter: string;
  Amount: number;
};

function enrichRows(rows: HubSpotRow[], columns: Set<string>): EnrichedRow[] {
  return rows.map((row) => {
    const amount = Number(row.Amount);
    const closeDate = parseDate(row["Close Date"]);
    const createDate = parseDate(row["Create Date"]);
    const cat = catKey(row["Forecast category"]);
    let lostQuarter = "";
    if (columns.has("Closed lost stage date")) {
      lostQuarter = quarterKeyFromValue(row["Closed lost stage date"]);
      if (cat === "Closed Lost" && !lostQuarter) {
        lostQuarter = closeDate ? quarterKeyFromDate(closeDate) : "";
      }
    }
    return {
      ...row,
      Amount: Number.isFinite(amount) ? amount : 0,
      category_group: cat,
      close_month: closeDate ? monthKeyFromDate(closeDate) : "",
      create_month: createDate ? monthKeyFromDate(createDate) : "",
      close_quarter: closeDate ? quarterKeyFromDate(closeDate) : "",
      lost_quarter: lostQuarter,
    };
  });
}

export async function generatePipelineFromExcelFile(
  file: File,
  dashCfg: DashboardConfig,
  oldColumnNames: Set<string> = new Set(),
): Promise<PipelineData> {
  const { rows, columns: columnList } = await readHubSpotExportRows(file);
  const columns = new Set(columnList);
  const columnReport = exportColumnReport(columnList, oldColumnNames, rows);
  const enriched = enrichRows(rows, columns);

  const today = new Date();
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monthKey = monthKeyFromDate(todayNorm);
  const quarterKey = quarterKeyFromDate(todayNorm);
  const quarterLbl = quarterLabel(quarterKey);

  const monthlyGoalEur = monthlyGoalFromConfig(dashCfg);
  const quarterlyGoalEur = monthlyGoalEur * 3;

  const months = [
    ...new Set(enriched.map((r) => r.close_month).filter((m) => m)),
  ].sort();

  const chartSeries = CHART_CATEGORIES.map((cat) => ({
    key: cat,
    data: months.map((m) => {
      const amt = enriched
        .filter((r) => r.category_group === cat && r.close_month === m)
        .reduce((s, r) => s + r.Amount, 0);
      const [y, mo] = m.split("-").map(Number);
      const monthStart = new Date(y!, mo! - 1, 1);
      return { key: monthStart.toISOString(), data: amt };
    }),
  }));

  const deals: PipelineDeal[] = enriched.map((r) => {
    const cat = catKey(r["Forecast category"]);
    const w = weightedAmount(r.Amount, cat);
    const createDate = parseDate(r["Create Date"]);
    const ageDays = createDate
      ? Math.floor((todayNorm.getTime() - createDate.getTime()) / 86400000)
      : 0;
    const dsa = daysBetween(todayNorm, r["Last Activity Date"]);
    const dsvt = columns.has("Last Valid Touchpoint")
      ? daysBetween(todayNorm, r["Last Valid Touchpoint"])
      : null;
    const dealScore = columns.has("Deal Score") ? safeFloat(r["Deal Score"]) : null;
    const touchpoints = columns.has("Number of Valid Touchpoints")
      ? safeInt(r["Number of Valid Touchpoints"])
      : null;
    const nextAct = rowNextActivity(r, rows);
    const stage = safeStr(r["Deal Stage"]);
    const closeLostDt = columns.has("Closed lost stage date")
      ? r["Closed lost stage date"]
      : null;

    const deal: PipelineDeal = {
      id: String(r["Record ID"]),
      name: safeStr(r["Deal Name"]),
      amount: r.Amount,
      weightedAmount: w,
      closeDate: isoOrNone(r["Close Date"]),
      createDate: isoOrNone(r["Create Date"]),
      ageDays,
      daysSinceActivity: dsa,
      daysSinceValidTouchpoint: dsvt,
      country: safeStr(r["Company country name"]),
      category: cat,
      stage,
      partner: safeStr(r["Partner name"]) || safeStr(r["Associated Partner"]),
      employees: safeInt(r["Revised number of employees"]),
      activities: safeInt(r["Number of Sales Activities"]) ?? 0,
      lastActivity: isoOrNone(r["Last Activity Date"]),
      nextStep: safeStr(r["Next step"], 280),
      closeMonthKey: r.close_month,
      closeQuarterKey: r.close_quarter,
      closeLostStageDate: isoOrNone(closeLostDt),
      lostQuarterKey: r.lost_quarter,
      dealScore,
      evaluationStageDate: columns.has("Evaluation stage date")
        ? isoOrNone(r["Evaluation stage date"])
        : null,
      daysInEvaluation: columns.has("Evaluation stage date")
        ? daysBetween(todayNorm, r["Evaluation stage date"])
        : null,
      validTouchpoints: touchpoints,
      lastValidTouchpoint: columns.has("Last Valid Touchpoint")
        ? isoOrNone(r["Last Valid Touchpoint"])
        : null,
      isStale: dealIsStale(cat, ageDays, dsa, stage, {
        daysSinceValidTouch: dsvt,
        nextActivityDate: nextAct,
        today: todayNorm,
      }),
      engagementRisk:
        cat !== "Closed Won" &&
        cat !== "Closed Lost" &&
        ((touchpoints != null && touchpoints <= 1) ||
          (dsvt != null && dsvt >= 14) ||
          (dealScore != null && dealScore < 40)),
      ...(rowOptionalFields(r, todayNorm, columns) as Partial<PipelineDeal>),
    };
    return deal;
  });

  const sumCat = (cat: string) =>
    enriched.filter((r) => r.category_group === cat).reduce((s, r) => s + r.Amount, 0);
  const countCat = (cat: string) => enriched.filter((r) => r.category_group === cat).length;

  const dfNoFirstDemo = enriched.filter((r) => !isFirstDemoStage(r["Deal Stage"]));
  const funnelDf = dfNoFirstDemo.filter((r) =>
    ["Closed Won", "Upside", "Pipeline"].includes(r.category_group),
  );
  const wonDf = funnelDf.filter((r) => r.category_group === "Closed Won");
  const funnelCount = funnelDf.length;
  const wonCount = wonDf.length;
  const conversionRatePct =
    funnelCount > 0 ? Math.round((100 * wonCount) / funnelCount * 10) / 10 : null;

  const hubDaysCol = columns.has("Time Between Creation and Closed Date");
  const cycleDays: number[] = [];
  for (const r of wonDf) {
    let dh: number | null = null;
    if (hubDaysCol) dh = safeInt(r["Time Between Creation and Closed Date"]);
    if (dh != null && dh >= 0) cycleDays.push(dh);
    else {
      const cd = parseDate(r["Create Date"]);
      const cl = parseDate(r["Close Date"]);
      if (cd && cl) {
        cycleDays.push(Math.max(0, Math.floor((cl.getTime() - cd.getTime()) / 86400000)));
      }
    }
  }
  const avgCycleDays =
    cycleDays.length > 0
      ? Math.round((cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) * 10) / 10
      : null;

  const lostQuarterRows = enriched.filter(
    (r) => r.category_group === "Closed Lost" && r.lost_quarter === quarterKey,
  );
  const lostQuarterCount = lostQuarterRows.length;
  const lostQuarterEur = lostQuarterRows.reduce((s, r) => s + r.Amount, 0);
  const wonQuarterCount = enriched.filter(
    (r) => r.category_group === "Closed Won" && r.close_quarter === quarterKey,
  ).length;
  const closedOutcomes = wonQuarterCount + lostQuarterCount;
  const winLossPct =
    closedOutcomes > 0
      ? Math.round((100 * wonQuarterCount) / closedOutcomes * 10) / 10
      : null;

  const firstDemoExcluded = enriched.filter((r) => isFirstDemoStage(r["Deal Stage"])).length;

  const conversionSnapshot = {
    ratePct: conversionRatePct,
    wonCount,
    funnelCount,
    firstDemoExcludedDealCount: firstDemoExcluded,
    avgSalesCycleDays: avgCycleDays,
    cycleSampleCount: cycleDays.length,
    winLossPct,
    quarterWonCount: wonQuarterCount,
    quarterLostCount: lostQuarterCount,
    quarterLostEur: Math.round(lostQuarterEur * 100) / 100,
    formulaEn:
      "Open funnel: won ÷ (Won + Upside + Pipeline) excluding First Demo. " +
      "Quarter win rate: closed won ÷ (closed won + closed lost) using close lost stage date for losses.",
  };

  const quarterDeals = enriched.filter((r) => r.close_quarter === quarterKey);

  const secured = quarterDeals
    .filter((r) => r.category_group === "Closed Won")
    .reduce((s, r) => s + r.Amount, 0);
  const weightedQuarterFixed = quarterDeals.reduce(
    (s, r) => s + weightedAmount(r.Amount, r.category_group),
    0,
  );

  const gapSecured = Math.max(0, quarterlyGoalEur - secured);
  const gapWeighted = Math.max(0, quarterlyGoalEur - weightedQuarterFixed);
  const progressPct = Math.min(100, Math.round((weightedQuarterFixed / quarterlyGoalEur) * 1000) / 10);
  const securedPct = Math.min(100, Math.round((secured / quarterlyGoalEur) * 1000) / 10);
  const rawChance = (weightedQuarterFixed / quarterlyGoalEur) * 72 + (secured / quarterlyGoalEur) * 28;
  const winChance = Math.min(92, Math.max(8, Math.round(rawChance)));

  const qMonths = quarterCalendarMonths(quarterKey);
  const qStart = new Date(`${qMonths[0]}-01`);
  const daysElapsed = Math.max(1, Math.floor((todayNorm.getTime() - qStart.getTime()) / 86400000) + 1);
  const daysInQuarter = daysLeftInQuarter(todayNorm) + todayNorm.getDate();
  const runRate = daysElapsed > 0 ? (secured / daysElapsed) * daysInQuarter : 0;
  const projectedQuarter = Math.round(
    Math.min(runRate + weightedQuarterFixed - secured, quarterlyGoalEur * 2),
  );

  const trendPoints: {
    week: string;
    secured: number;
    weighted: number;
    goal: number;
    trend: number;
  }[] = [];
  let cumulativeSecured = 0;
  let cumulativeWeighted = 0;
  for (const m of qMonths) {
    const [y, mo] = m.split("-").map(Number);
    const monthStart = new Date(y!, mo! - 1, 1);
    const monthEnd = new Date(y!, mo!, 1);
    const monthDeals = quarterDeals.filter((r) => {
      const cd = parseDate(r["Close Date"]);
      return cd && cd >= monthStart && cd < monthEnd;
    });
    const wSecured = monthDeals
      .filter((r) => r.category_group === "Closed Won")
      .reduce((s, r) => s + r.Amount, 0);
    const wWeighted = monthDeals.reduce(
      (s, r) => s + weightedAmount(r.Amount, r.category_group),
      0,
    );
    cumulativeSecured += wSecured;
    cumulativeWeighted += wWeighted;
    const mLabel = monthStart.toLocaleDateString("en-GB", { month: "short" });
    trendPoints.push({
      week: mLabel,
      secured: Math.round(cumulativeSecured * 100) / 100,
      weighted: Math.round(cumulativeWeighted * 100) / 100,
      goal: quarterlyGoalEur,
      trend: 0,
    });
  }
  if (trendPoints.length >= 1 && daysElapsed > 0) {
    const slope = cumulativeWeighted / daysElapsed;
    trendPoints.forEach((pt, i) => {
      const daysAtPoint = Math.min(daysInQuarter, (i + 1) * 30);
      pt.trend = Math.round(slope * daysAtPoint * 100) / 100;
    });
  } else {
    trendPoints.forEach((pt) => {
      pt.trend = pt.weighted;
    });
  }

  const outlookQuarterSet = new Set<string>();
  for (const r of enriched) {
    if (r.close_quarter && r.close_quarter >= quarterKey) outlookQuarterSet.add(r.close_quarter);
    if (r.lost_quarter && r.lost_quarter >= quarterKey) outlookQuarterSet.add(r.lost_quarter);
  }
  let outlookQuarters = [...outlookQuarterSet].sort().slice(0, 4);
  if (!outlookQuarters.includes(quarterKey)) {
    outlookQuarters = [quarterKey, ...outlookQuarters];
  }
  outlookQuarters = [...new Set(outlookQuarters)].sort().slice(0, 4);

  const quarterOutlook = outlookQuarters.map((qk) => {
    const qClose = enriched.filter((r) => r.close_quarter === qk);
    const qLost = enriched.filter(
      (r) => r.category_group === "Closed Lost" && r.lost_quarter === qk,
    );
    const qSecured = qClose
      .filter((r) => r.category_group === "Closed Won")
      .reduce((s, r) => s + r.Amount, 0);
    const qWeighted = qClose.reduce(
      (s, r) => s + weightedAmount(r.Amount, r.category_group),
      0,
    );
    const qLostEur = qLost.reduce((s, r) => s + r.Amount, 0);
    const openWeighted = qClose
      .filter((r) => !["Closed Won", "Closed Lost"].includes(r.category_group))
      .reduce((s, r) => s + weightedAmount(r.Amount, r.category_group), 0);
    return {
      quarter: qk,
      label: quarterLabel(qk),
      isCurrent: qk === quarterKey,
      targetEur: quarterlyGoalEur,
      securedEur: Math.round(qSecured * 100) / 100,
      weightedEur: Math.round(qWeighted * 100) / 100,
      lostEur: Math.round(qLostEur * 100) / 100,
      openWeightedEur: Math.round(openWeighted * 100) / 100,
      dealCount: qClose.length,
    };
  });

  const createdThisMonth = enriched.filter((r) => r.create_month === monthKey);
  const createdThisMonthEur = createdThisMonth.reduce((s, r) => s + r.Amount, 0);

  const openRows = enriched.filter(
    (r) => !["Closed Won", "Closed Lost"].includes(r.category_group),
  );
  const ages = openRows
    .map((r) => {
      const cd = parseDate(r["Create Date"]);
      return cd ? Math.floor((todayNorm.getTime() - cd.getTime()) / 86400000) : null;
    })
    .filter((d): d is number => d != null);
  const avgAgeDays = ages.length ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 : 0;

  const openDeals = deals.filter((d) => !["Closed Won", "Closed Lost"].includes(d.category));
  const scores = openDeals.map((d) => d.dealScore).filter((s): s is number => s != null);
  const avgDealScore = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null;
  const lowScoreCount = openDeals.filter((d) => (d.dealScore ?? 100) < 40).length;
  const engagementRiskCount = openDeals.filter((d) => d.engagementRisk).length;
  const scheduledFollowups = openDeals.filter((d) => d.hasScheduledActivity).length;
  const noEvalDateCount = openDeals.filter(
    (d) => !d.evaluationStageDate && d.stage.toLowerCase().includes("evaluation"),
  ).length;

  const staleList: {
    id: string;
    name: string;
    amount: number;
    stage: string;
    ageDays: number;
    daysSinceActivity: number | null;
    daysSinceValidTouchpoint?: number | null;
    category: string;
    dealScore?: number | null;
    validTouchpoints?: number | null;
    reason?: string;
  }[] = [];
  let staleN = 0;
  for (const r of enriched) {
    const cat = r.category_group;
    const ageD = parseDate(r["Create Date"])
      ? Math.floor((todayNorm.getTime() - parseDate(r["Create Date"])!.getTime()) / 86400000)
      : 0;
    const dsa = daysBetween(todayNorm, r["Last Activity Date"]);
    const dsvt = columns.has("Last Valid Touchpoint")
      ? daysBetween(todayNorm, r["Last Valid Touchpoint"])
      : null;
    const stage = safeStr(r["Deal Stage"]);
    const nextAct = rowNextActivity(r, rows);
    const dealScore = columns.has("Deal Score") ? safeFloat(r["Deal Score"]) : null;
    const touchpoints = columns.has("Number of Valid Touchpoints")
      ? safeInt(r["Number of Valid Touchpoints"])
      : null;
    if (
      !dealIsStale(cat, ageD, dsa, stage, {
        daysSinceValidTouch: dsvt,
        nextActivityDate: nextAct,
        today: todayNorm,
      })
    ) {
      continue;
    }
    staleN += 1;
    staleList.push({
      id: String(r["Record ID"]),
      name: safeStr(r["Deal Name"]),
      amount: r.Amount,
      stage,
      ageDays: ageD,
      daysSinceActivity: dsa,
      daysSinceValidTouchpoint: dsvt,
      category: cat,
      dealScore,
      validTouchpoints: touchpoints,
      reason: staleReason(cat, ageD, dsa, stage, {
        daysSinceValidTouch: dsvt,
        nextActivityDate: nextAct,
        today: todayNorm,
        dealScore,
        validTouchpoints: touchpoints,
      }),
    });
  }
  staleList.sort((a, b) => {
    if (b.ageDays !== a.ageDays) return b.ageDays - a.ageDays;
    return b.amount - a.amount;
  });
  const staleTop5 = staleList.slice(0, 5);

  const priorityDeals = [...quarterDeals]
    .sort((a, b) => b.Amount - a.Amount)
    .filter((r) => !["Closed Won", "Closed Lost"].includes(r.category_group))
    .map((r) => {
      const dMatch = deals.find((d) => d.id === String(r["Record ID"]));
      const closeDate = parseDate(r["Close Date"]);
      return {
        id: String(r["Record ID"]),
        name: String(r["Deal Name"]),
        amount: r.Amount,
        category: r.category_group,
        weighted: weightedAmount(r.Amount, r.category_group),
        closeDate: closeDate
          ? `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, "0")}-${String(closeDate.getDate()).padStart(2, "0")}`
          : null,
        nextStep: safeStr(r["Next step"], 200),
        dealScore: dMatch?.dealScore ?? null,
        validTouchpoints: dMatch?.validTouchpoints ?? null,
        daysSinceValidTouchpoint: dMatch?.daysSinceValidTouchpoint ?? null,
        engagementRisk: Boolean(dMatch?.engagementRisk),
      };
    })
    .slice(0, 5);

  const improvementBullets: string[] = [];
  if (engagementRiskCount) {
    improvementBullets.push(
      `${engagementRiskCount} open deal(s) show engagement risk (≤1 valid touchpoint, 14+ days since last touch, or score under 40).`,
    );
  }
  if (lowScoreCount) {
    improvementBullets.push(
      `${lowScoreCount} open deal(s) have HubSpot deal score below 40 — revisit qualification and next steps.`,
    );
  }
  if (scheduledFollowups) {
    improvementBullets.push(
      `${scheduledFollowups} open deal(s) already have a future activity scheduled (excluded from stale flags).`,
    );
  }
  if (noEvalDateCount) {
    improvementBullets.push(
      `${noEvalDateCount} deal(s) in evaluation stage missing evaluation date — add dates in HubSpot for velocity tracking.`,
    );
  }
  if (columns.has("Number of Valid Touchpoints")) {
    const tpVals = openRows
      .map((r) => safeFloat(r["Number of Valid Touchpoints"]))
      .filter((v): v is number => v != null);
    if (tpVals.length) {
      const avgTp = Math.round((tpVals.reduce((a, b) => a + b, 0) / tpVals.length) * 10) / 10;
      improvementBullets.push(
        `Average valid touchpoints on open deals: ${avgTp} (aim for steady outbound + discovery touches on upside deals).`,
      );
    }
  }

  const topPriority = priorityDeals[0];
  const monthLabel = todayNorm.toLocaleDateString("en-GB", { month: "long" });
  const bullets: string[] = [
    `${quarterLbl} goal €${quarterlyGoalEur.toLocaleString("en-GB")} (€${monthlyGoalEur.toLocaleString("en-GB")}/mo): ${progressPct.toFixed(0)}% by weighted forecast — €${secured.toLocaleString("en-GB")} secured, €${weightedQuarterFixed.toLocaleString("en-GB")} weighted.`,
    `Estimated chance to reach ${quarterLbl} goal: ~${winChance}%. Gap to close (secured): €${gapSecured.toLocaleString("en-GB")} · Gap with forecast: €${gapWeighted.toLocaleString("en-GB")}.`,
  ];
  if (lostQuarterCount > 0) {
    const wl = winLossPct != null ? `${winLossPct.toFixed(0)}%` : "—";
    bullets.push(
      `Closed lost this quarter: €${lostQuarterEur.toLocaleString("en-GB")} across ${lostQuarterCount} deal(s) (date from Closed lost stage date). Win rate on closed outcomes: ${wl}.`,
    );
  }
  if (topPriority) {
    let scoreBit = "";
    if (topPriority.dealScore != null) scoreBit = `, score ${topPriority.dealScore.toFixed(0)}`;
    let touchBit = "";
    if (topPriority.validTouchpoints != null) {
      touchBit = `, ${topPriority.validTouchpoints} valid touchpoint(s)`;
    }
    bullets.push(
      `Largest upside this month: "${topPriority.name}" (€${topPriority.amount.toLocaleString("en-GB")} nominal, €${topPriority.weighted.toLocaleString("en-GB")} weighted${scoreBit}${touchBit}).`,
    );
  }
  bullets.push(
    `Pipe created (by create date) in ${monthLabel}: €${createdThisMonthEur.toLocaleString("en-GB")} (${createdThisMonth.length} deals).`,
  );
  if (avgDealScore != null) {
    bullets.push(
      `Open pipeline average deal score: ${avgDealScore} (HubSpot 0–100; higher = healthier engagement signals).`,
    );
  }
  bullets.push(
    `Deals flagged for attention (stale / early-stage + quiet, excluding scheduled follow-ups): ${staleN}. Forecast detail and edits: HubSpot.`,
  );
  if (conversionSnapshot.ratePct != null) {
    const cyl =
      conversionSnapshot.avgSalesCycleDays != null
        ? conversionSnapshot.avgSalesCycleDays.toFixed(1)
        : "—";
    bullets.push(
      `Conversion snapshot (excl. First Demo): ${conversionSnapshot.ratePct.toFixed(1)}% (${conversionSnapshot.wonCount}/${conversionSnapshot.funnelCount} Won+Upside+Pipeline). Average closed-won sales cycle: ${cyl} days across ${conversionSnapshot.cycleSampleCount} deal(s).`,
    );
  }
  bullets.push(...improvementBullets.slice(0, 3));

  const countries = [
    ...new Set(
      enriched
        .map((r) => safeStr(r["Company country name"]))
        .filter((c) => c),
    ),
  ].sort();

  const totalActivities = enriched.reduce(
    (s, r) => s + (safeInt(r["Number of Sales Activities"]) ?? 0),
    0,
  );

  const sortedDeals = [...deals].sort((a, b) => {
    const aq = a.closeQuarterKey === quarterKey ? 1 : 0;
    const bq = b.closeQuarterKey === quarterKey ? 1 : 0;
    if (bq !== aq) return bq - aq;
    const al = a.lostQuarterKey === quarterKey ? 1 : 0;
    const bl = b.lostQuarterKey === quarterKey ? 1 : 0;
    if (bl !== al) return bl - al;
    return b.weightedAmount - a.weightedAmount;
  });

  return {
    meta: {
      owner: "Victor Gutierrez",
      role: "Partner Account Executive",
      team: "ROW",
      exportedAt: todayNorm.toISOString().slice(0, 10),
      source: `HubSpot CRM — ${file.name}`,
      briefTitle: "ROW Pipeline Brief",
      hubspotForecastUrl: dashCfg.hubspotForecastUrl,
      hubspotPortalId: dashCfg.hubspotPortalId,
      hubspotDealBaseOrigin: dashCfg.hubspotDealBaseOrigin,
      exportFile: file.name,
    },
    summary: {
      totalDeals: enriched.length,
      totalPipeline: Math.round(enriched.reduce((s, r) => s + r.Amount, 0) * 100) / 100,
      upsideValue: Math.round(sumCat("Upside") * 100) / 100,
      upsideCount: countCat("Upside"),
      pipelineValue: Math.round(sumCat("Pipeline") * 100) / 100,
      pipelineCount: countCat("Pipeline"),
      closedWonValue: Math.round(sumCat("Closed Won") * 100) / 100,
      closedWonCount: countCat("Closed Won"),
      closedLostValue: Math.round(sumCat("Closed Lost") * 100) / 100,
      closedLostCount: countCat("Closed Lost"),
      notForecastedValue: Math.round(sumCat("Not Forecasted") * 100) / 100,
      notForecastedCount: countCat("Not Forecasted"),
      avgDealSize:
        enriched.length > 0
          ? Math.round((enriched.reduce((s, r) => s + r.Amount, 0) / enriched.length) * 100) / 100
          : 0,
      totalActivities,
      countries,
      avgDealScore,
      engagementRiskCount,
      scheduledFollowupCount: scheduledFollowups,
    },
    pipelineHealth: {
      month: quarterKey,
      monthLabel: quarterLbl,
      calendarMonth: monthKey,
      calendarMonthLabel: todayNorm.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      createdThisMonthEur: Math.round(createdThisMonthEur * 100) / 100,
      createdThisMonthCount: createdThisMonth.length,
      avgDealAgeDays: avgAgeDays,
      avgDealScore,
      engagementRiskCount,
      lowDealScoreCount: lowScoreCount,
      scheduledFollowupCount: scheduledFollowups,
      staleDealCount: staleN,
      staleDeals: staleTop5,
      improvementPoints: improvementBullets,
    },
    executiveBullets: bullets,
    chartSeries,
    chartMonths: months,
    conversionSnapshot,
    goal: {
      targetEur: quarterlyGoalEur,
      monthlyTargetEur: monthlyGoalEur,
      month: quarterKey,
      monthLabel: quarterLbl,
      quarter: quarterKey,
      quarterLabel: quarterLbl,
      securedEur: Math.round(secured * 100) / 100,
      lostEur: Math.round(lostQuarterEur * 100) / 100,
      weightedEur: Math.round(weightedQuarterFixed * 100) / 100,
      gapEur: Math.round(gapSecured * 100) / 100,
      gapWeightedEur: Math.round(gapWeighted * 100) / 100,
      progressPct,
      securedPct,
      winChancePct: winChance,
      winLossPct,
      projectedEur: projectedQuarter,
      daysLeft: daysLeftInQuarter(todayNorm),
      trend: trendPoints,
      priorityDeals,
    },
    quarterOutlook,
    deals: sortedDeals,
    columnReport,
  };
}
