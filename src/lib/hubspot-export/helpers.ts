import {
  CATEGORY_WEIGHTS,
  MONTHLY_GOAL_DEFAULT_EUR,
  OPTIONAL_DATE_COLUMNS,
  OPTIONAL_SCALAR_COLUMNS,
  type DashboardConfig,
} from "./constants";

export type HubSpotRow = Record<string, unknown>;

export function catKey(c: unknown): string {
  if (c == null || c === "") return "Other";
  const sl = String(c).trim().toLowerCase();
  if (sl.includes("closed lost")) return "Closed Lost";
  if ((sl.includes("closed") && sl.includes("won")) || sl === "closed won") return "Closed Won";
  if (sl.includes("upside")) return "Upside";
  if (sl.includes("pipeline") && !sl.includes("closed")) return "Pipeline";
  if (sl.includes("not forecasted")) return "Not Forecasted";
  return "Other";
}

export function parseDate(val: unknown): Date | null {
  if (val == null || val === "") return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) return startOfDay(val);
  if (typeof val === "number" && val > 20000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    return Number.isNaN(d.getTime()) ? null : startOfDay(d);
  }
  const d = new Date(String(val));
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function quarterKeyFromDate(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

export function quarterKeyFromValue(val: unknown): string {
  const d = parseDate(val);
  return d ? quarterKeyFromDate(d) : "";
}

export function quarterLabel(qk: string): string {
  if (!qk || !qk.includes("-Q")) return qk;
  const [y, qn] = qk.split("-Q");
  return `Q${qn} ${y}`;
}

export function quarterCalendarMonths(qk: string): string[] {
  if (!qk || !qk.includes("-Q")) return [];
  const y = parseInt(qk.split("-Q")[0]!, 10);
  const qn = parseInt(qk.split("-Q")[1]!, 10);
  const start = (qn - 1) * 3 + 1;
  return [0, 1, 2].map((i) => `${y}-${String(start + i).padStart(2, "0")}`);
}

export function daysLeftInQuarter(today: Date): number {
  const qn = Math.floor(today.getMonth() / 3) + 1;
  const endMonth = qn * 3;
  const quarterEnd = new Date(today.getFullYear(), endMonth, 0);
  const diff = Math.floor((quarterEnd.getTime() - startOfDay(today).getTime()) / 86400000);
  return Math.max(0, diff);
}

export function monthlyGoalFromConfig(cfg: DashboardConfig): number {
  const raw = cfg.monthlyQuotaEur;
  if (raw == null || raw === 0) return MONTHLY_GOAL_DEFAULT_EUR;
  if (!Number.isFinite(raw) || raw <= 0) return MONTHLY_GOAL_DEFAULT_EUR;
  return raw;
}

export function colPresent(rows: HubSpotRow[], name: string): boolean {
  return rows.length > 0 && name in rows[0]!;
}

export function safeStr(val: unknown, maxLen?: number): string {
  if (val == null) return "";
  let s = String(val).trim();
  if (maxLen && s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

export function safeInt(val: unknown): number | null {
  if (val == null || val === "") return null;
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export function safeFloat(val: unknown): number | null {
  if (val == null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export function isoOrNone(val: unknown): string | null {
  const d = parseDate(val);
  return d ? d.toISOString() : null;
}

export function daysBetween(today: Date, dt: unknown): number | null {
  const d = parseDate(dt);
  if (!d) return null;
  return Math.floor((startOfDay(today).getTime() - d.getTime()) / 86400000);
}

export function hasScheduledActivity(nextActivity: unknown, today: Date): boolean {
  const d = parseDate(nextActivity);
  if (!d) return false;
  return d.getTime() >= startOfDay(today).getTime();
}

export function effectiveDaysSinceContact(
  daysSinceActivity: number | null,
  daysSinceValidTouch: number | null,
): number | null {
  if (daysSinceValidTouch != null && daysSinceActivity != null) {
    return Math.min(daysSinceValidTouch, daysSinceActivity);
  }
  if (daysSinceValidTouch != null) return daysSinceValidTouch;
  return daysSinceActivity;
}

export function dealIsStale(
  cat: string,
  ageDays: number,
  daysSinceActivity: number | null,
  stage: string,
  opts: {
    daysSinceValidTouch?: number | null;
    nextActivityDate?: unknown;
    today?: Date;
  } = {},
): boolean {
  const today = opts.today ?? new Date();
  if (cat === "Closed Won" || cat === "Closed Lost") return false;
  if (opts.nextActivityDate != null && hasScheduledActivity(opts.nextActivityDate, today)) {
    return false;
  }
  const stageL = stage.toLowerCase();
  const earlyStage = stageL.includes("new deals") || stageL.startsWith("demo");
  const contactGap = effectiveDaysSinceContact(daysSinceActivity, opts.daysSinceValidTouch ?? null);
  const dormant =
    (contactGap != null && contactGap >= 14) ||
    (contactGap == null && ageDays >= 14);
  if (ageDays < 30) return false;
  return dormant || earlyStage;
}

export function staleReason(
  cat: string,
  ageDays: number,
  daysSinceActivity: number | null,
  stage: string,
  opts: {
    daysSinceValidTouch?: number | null;
    nextActivityDate?: unknown;
    today?: Date;
    dealScore?: number | null;
    validTouchpoints?: number | null;
  } = {},
): string {
  const today = opts.today ?? new Date();
  if (cat === "Closed Won" || cat === "Closed Lost") return "";
  if (opts.nextActivityDate != null && hasScheduledActivity(opts.nextActivityDate, today)) {
    return "";
  }
  const stageL = stage.toLowerCase();
  const contactGap = effectiveDaysSinceContact(daysSinceActivity, opts.daysSinceValidTouch ?? null);
  const parts: string[] = [];
  if (stageL.includes("new deals") || stageL.startsWith("demo")) parts.push("early stage");
  if (contactGap != null && contactGap >= 14) {
    parts.push(`no meaningful contact in ${contactGap}d`);
  } else if (contactGap == null && ageDays >= 14) {
    parts.push("no activity or touchpoint dates");
  }
  if (opts.validTouchpoints != null && opts.validTouchpoints <= 1) {
    parts.push("low touchpoints");
  }
  if (opts.dealScore != null && opts.dealScore < 40) parts.push("low deal score");
  return parts.length ? parts.join(" · ") : "needs follow-up";
}

export function isFirstDemoStage(stage: unknown): boolean {
  return safeStr(stage).toLowerCase().includes("first demo");
}

export function monthKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function weightedAmount(amount: number, cat: string): number {
  return Math.round(amount * (CATEGORY_WEIGHTS[cat] ?? 0.1) * 100) / 100;
}

export function rowNextActivity(row: HubSpotRow, rows: HubSpotRow[]): unknown {
  for (const col of ["Next activity date including sequences", "Next activity date"]) {
    if (colPresent(rows, col)) return row[col];
  }
  return null;
}

export function exportColumnReport(
  columns: string[],
  oldColumns: Set<string>,
  rows: HubSpotRow[],
): {
  columnCount: number;
  newColumns: string[];
  optionalHubspotColumnsFound: string[];
  fillRatesPct: Record<string, number>;
} {
  const present = new Set(columns);
  const newColumns = [...present].filter((c) => !oldColumns.has(c)).sort();
  const optionalKeys = new Set([
    ...Object.keys(OPTIONAL_DATE_COLUMNS),
    ...Object.keys(OPTIONAL_SCALAR_COLUMNS),
  ]);
  const optionalHubspotColumnsFound = [...optionalKeys].filter((c) => present.has(c)).sort();
  const fillRatesPct: Record<string, number> = {};
  const n = rows.length || 1;
  for (const c of columns) {
    const filled = rows.filter((r) => r[c] != null && r[c] !== "").length;
    fillRatesPct[c] = Math.round((filled / n) * 1000) / 10;
  }
  return {
    columnCount: columns.length,
    newColumns,
    optionalHubspotColumnsFound,
    fillRatesPct,
  };
}

export function rowOptionalFields(
  row: HubSpotRow,
  today: Date,
  columns: Set<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [hubspotCol, key] of Object.entries(OPTIONAL_DATE_COLUMNS)) {
    if (!columns.has(hubspotCol)) continue;
    const val = row[hubspotCol];
    out[key] = isoOrNone(val);
    if (key === "nextActivityDate") {
      out.hasScheduledActivity = hasScheduledActivity(val, today);
    }
  }
  for (const [hubspotCol, key] of Object.entries(OPTIONAL_SCALAR_COLUMNS)) {
    if (!columns.has(hubspotCol)) continue;
    const val = row[hubspotCol];
    if (key === "outboundCalls" || key === "attemptCount" || key === "daysCreationToClose") {
      out[key] = safeInt(val);
    } else if (key === "inContactWithDecisionMaker") {
      if (val == null || val === "") out[key] = null;
      else {
        const s = String(val).trim().toLowerCase();
        out[key] = s === "true" || s === "yes" || s === "1";
      }
    } else {
      out[key] = safeStr(val, 120) || null;
    }
  }
  return out;
}
