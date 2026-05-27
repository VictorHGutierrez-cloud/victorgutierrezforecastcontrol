import { DEFAULT_DASHBOARD_CONFIG, type DashboardConfig } from "./constants";
import { getPublicPath } from "@/lib/public-path";

export async function loadDashboardConfig(): Promise<DashboardConfig> {
  try {
    const res = await fetch(getPublicPath("/data/dashboard-config.json"), { cache: "no-store" });
    if (!res.ok) return DEFAULT_DASHBOARD_CONFIG;
    const json = (await res.json()) as Record<string, unknown>;
    const rawQuota = json.monthlyQuotaEur;
    let monthlyQuotaEur: number | null = null;
    if (rawQuota != null && rawQuota !== "") {
      const n = Number(rawQuota);
      monthlyQuotaEur = Number.isFinite(n) ? n : null;
    }
    return {
      hubspotForecastUrl: String(json.hubspotForecastUrl ?? ""),
      hubspotPortalId: String(json.hubspotPortalId ?? ""),
      hubspotDealBaseOrigin: String(json.hubspotDealBaseOrigin ?? ""),
      monthlyQuotaEur,
    };
  } catch {
    return DEFAULT_DASHBOARD_CONFIG;
  }
}
