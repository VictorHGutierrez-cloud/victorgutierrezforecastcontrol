export interface ChartDataPoint {
  key: string;
  data: number;
}

export interface ChartSeries {
  key: string;
  data: ChartDataPoint[];
}

export interface PipelineDeal {
  id: string;
  name: string;
  amount: number;
  weightedAmount: number;
  closeDate: string | null;
  createDate: string | null;
  ageDays: number;
  daysSinceActivity: number | null;
  country: string;
  category: string;
  stage: string;
  partner: string;
  employees: number | null;
  activities: number;
  lastActivity: string | null;
  nextStep: string;
  closeMonthKey: string;
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
}

export interface StaleDeal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  ageDays: number;
  daysSinceActivity: number | null;
  category: string;
}

export interface PipelineHealth {
  month: string;
  monthLabel: string;
  createdThisMonthEur: number;
  createdThisMonthCount: number;
  avgDealAgeDays: number;
  staleDealCount: number;
  staleDeals: StaleDeal[];
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
}

export interface MonthlyGoal {
  targetEur: number;
  month: string;
  monthLabel: string;
  securedEur: number;
  weightedEur: number;
  gapEur: number;
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
}
