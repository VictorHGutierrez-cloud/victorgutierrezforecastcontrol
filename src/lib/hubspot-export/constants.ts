export const MONTHLY_GOAL_DEFAULT_EUR = 2000;

export const CATEGORY_WEIGHTS: Record<string, number> = {
  "Closed Won": 1.0,
  "Closed Lost": 0.0,
  Upside: 0.55,
  Pipeline: 0.25,
  "Not Forecasted": 0.08,
  Other: 0.1,
};

export const REQUIRED_HUBSPOT_COLUMNS = [
  "Record ID",
  "Deal Name",
  "Amount",
  "Forecast category",
  "Close Date",
  "Create Date",
  "Deal Stage",
  "Company country name",
  "Number of Sales Activities",
  "Next step",
] as const;

export const OPTIONAL_DATE_COLUMNS: Record<string, string> = {
  "Last Contacted": "lastContacted",
  "Next activity date": "nextActivityDate",
  "Next activity date including sequences": "nextActivityDate",
  "Demo date": "demoDate",
  "Date entered current stage": "stageEnteredDate",
  "Closed Date": "closeDate",
  "Closed lost stage date": "closeLostStageDate",
};

export const OPTIONAL_SCALAR_COLUMNS: Record<string, string> = {
  "Demo Status": "demoStatus",
  "No show": "noShow",
  "No show reason": "noShowReason",
  "Outbound Category": "outboundCategory",
  "In contact with Decision Maker": "inContactWithDecisionMaker",
  "Deal stuck": "dealStuck",
  "Deal stuck reason": "dealStuckReason",
  "Number of calls outbound": "outboundCalls",
  "Number of Attempts": "attemptCount",
  "Time Between Creation and Closed Date": "daysCreationToClose",
};

export const CHART_CATEGORIES = [
  "Upside",
  "Pipeline",
  "Closed Won",
  "Closed Lost",
  "Not Forecasted",
] as const;

export type DashboardConfig = {
  hubspotForecastUrl: string;
  hubspotPortalId: string;
  hubspotDealBaseOrigin: string;
  monthlyQuotaEur: number | null;
};

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  hubspotForecastUrl: "",
  hubspotPortalId: "",
  hubspotDealBaseOrigin: "",
  monthlyQuotaEur: null,
};
