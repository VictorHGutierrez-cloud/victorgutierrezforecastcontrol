export interface ChartDataPoint {
  key: string;
  data: number;
}

export interface ChartSeries {
  key: string;
  data: ChartDataPoint[];
}

/** Optional HubSpot fields — present when included in export */
export interface DealEngagementExtras {
  lastContacted?: string | null;
  nextActivityDate?: string | null;
  hasScheduledActivity?: boolean;
  demoStatus?: string | null;
  noShow?: string | null;
  outboundCategory?: string | null;
  inContactWithDecisionMaker?: boolean | null;
  dealStuck?: string | null;
  outboundCalls?: number | null;
  attemptCount?: number | null;
}

export interface PipelineDeal extends DealEngagementExtras {
  id: string;
  name: string;
  amount: number;
  weightedAmount: number;
  closeDate: string | null;
  createDate: string | null;
  ageDays: number;
  daysSinceActivity: number | null;
  daysSinceValidTouchpoint?: number | null;
  country: string;
  category: string;
  stage: string;
  partner: string;
  employees: number | null;
  activities: number;
  lastActivity: string | null;
  nextStep: string;
  closeMonthKey: string;
  dealScore?: number | null;
  evaluationStageDate?: string | null;
  daysInEvaluation?: number | null;
  validTouchpoints?: number | null;
  lastValidTouchpoint?: string | null;
  isStale?: boolean;
  engagementRisk?: boolean;
}

export interface PipelineSummary {
  totalDeals: number;
  totalPipeline: number;
  upsideValue: number;
  upsideCount: number;
  pipelineValue: number;
  pipelineCount: number;
  closedWonValue: number;
  closedWonCount: number;
  notForecastedValue: number;
  notForecastedCount: number;
  avgDealSize: number;
  totalActivities: number;
  countries: string[];
  avgDealScore?: number | null;
  engagementRiskCount?: number;
  scheduledFollowupCount?: number;
}

export interface StaleDeal {
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
}

export interface PipelineHealth {
  month: string;
  monthLabel: string;
  createdThisMonthEur: number;
  createdThisMonthCount: number;
  avgDealAgeDays: number;
  avgDealScore?: number | null;
  engagementRiskCount?: number;
  lowDealScoreCount?: number;
  scheduledFollowupCount?: number;
  staleDealCount: number;
  staleDeals: StaleDeal[];
  improvementPoints?: string[];
}

export interface GoalTrendPoint {
  week: string;
  secured: number;
  weighted: number;
  goal: number;
  trend: number;
}

export interface PriorityDeal {
  id: string;
  name: string;
  amount: number;
  category: string;
  weighted: number;
  closeDate: string | null;
  nextStep: string;
  dealScore?: number | null;
  validTouchpoints?: number | null;
  daysSinceValidTouchpoint?: number | null;
  engagementRisk?: boolean;
}

export interface MonthlyGoal {
  targetEur: number;
  month: string;
  monthLabel: string;
  securedEur: number;
  weightedEur: number;
  /** Target minus secured (Closed Won this month) — primary 1:1 gap. */
  gapEur: number;
  /** Target minus weighted forecast (open + closed with category weights). */
  gapWeightedEur: number;
  progressPct: number;
  securedPct: number;
  winChancePct: number;
  projectedEur: number;
  daysLeft: number;
  trend: GoalTrendPoint[];
  priorityDeals: PriorityDeal[];
}

export interface PipelineMeta {
  owner: string;
  role: string;
  team: string;
  exportedAt: string;
  source: string;
  briefTitle: string;
  hubspotForecastUrl: string;
  hubspotPortalId: string;
  /** e.g. https://app-eu1.hubspot.com — omit or empty for global app.hubspot.com */
  hubspotDealBaseOrigin?: string;
  exportFile?: string;
}

export interface ColumnReport {
  columnCount: number;
  newColumns: string[];
  optionalHubspotColumnsFound: string[];
  fillRatesPct: Record<string, number>;
}

/** Funnel conversion + closed-won velocity (see generator; excludes First Demo stage). */
export interface ConversionSnapshot {
  ratePct: number | null;
  wonCount: number;
  funnelCount: number;
  firstDemoExcludedDealCount: number;
  avgSalesCycleDays: number | null;
  cycleSampleCount: number;
  formulaEn: string;
}

export interface PipelineData {
  meta: PipelineMeta;
  summary: PipelineSummary;
  pipelineHealth: PipelineHealth;
  executiveBullets: string[];
  chartSeries: ChartSeries[];
  chartMonths: string[];
  goal: MonthlyGoal;
  deals: PipelineDeal[];
  columnReport?: ColumnReport;
  conversionSnapshot?: ConversionSnapshot;
}
