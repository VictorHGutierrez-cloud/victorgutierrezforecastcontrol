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
  closeDate: string | null;
  country: string;
  category: string;
  stage: string;
  partner: string;
  employees: number | null;
  activities: number;
  lastActivity: string | null;
  nextStep: string;
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

export interface PipelineMeta {
  owner: string;
  role: string;
  team: string;
  exportedAt: string;
  source: string;
}

export interface PipelineData {
  meta: PipelineMeta;
  summary: PipelineSummary;
  chartSeries: ChartSeries[];
  chartMonths: string[];
  deals: PipelineDeal[];
}
