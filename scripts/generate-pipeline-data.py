#!/usr/bin/env python3
"""Convert HubSpot Forecast Control export to pipeline.json for the dashboard."""

import json
import sys
from pathlib import Path

import pandas as pd


MONTHLY_GOAL_EUR = 2000
CATEGORY_WEIGHTS = {
    "Closed Won": 1.0,
    "Upside": 0.55,
    "Pipeline": 0.25,
    "Not Forecasted": 0.08,
    "Other": 0.1,
}


def cat_key(c: object) -> str:
    if pd.isna(c):
        return "Other"
    s = str(c).strip()
    if "Upside" in s:
        return "Upside"
    if "Pipeline" in s:
        return "Pipeline"
    if "Closed" in s or "won" in s.lower():
        return "Closed Won"
    if "not forecasted" in s.lower():
        return "Not Forecasted"
    return "Other"


def load_dashboard_config(root: Path) -> dict:
    cfg_path = root / "public" / "data" / "dashboard-config.json"
    defaults = {
        "hubspotForecastUrl": "",
        "hubspotPortalId": "",
        "hubspotDealBaseOrigin": "",
    }
    if not cfg_path.exists():
        return defaults
    try:
        merged = {**defaults, **json.loads(cfg_path.read_text())}
        return merged
    except json.JSONDecodeError:
        return defaults


def deal_is_stale(cat, age_days, days_since_activity, stage):
    if cat == "Closed Won":
        return False
    stage_l = stage.lower()
    early_stage = "new deals" in stage_l or stage_l.startswith("demo")
    dormant = (
        days_since_activity is not None and days_since_activity >= 14
    ) or (days_since_activity is None and age_days >= 14)
    if age_days < 30:
        return False
    return dormant or early_stage


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    xlsx = root / "hubspot-crm-exports-forecast-control-2026-05-19.xlsx"
    if len(sys.argv) > 1:
        xlsx = Path(sys.argv[1])

    dash_cfg = load_dashboard_config(root)

    df = pd.read_excel(xlsx)
    df.columns = [str(c).strip() for c in df.columns]

    for col in ["Close Date", "Create Date", "Last Activity Date"]:
        df[col] = pd.to_datetime(df[col], errors="coerce")
    df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce").fillna(0)
    df["category_group"] = df["Forecast category"].apply(cat_key)
    df["close_month"] = df["Close Date"].dt.strftime("%Y-%m")
    df["create_month"] = df["Create Date"].dt.strftime("%Y-%m")

    today = pd.Timestamp.now().normalize()
    month_key = today.strftime("%Y-%m")

    def row_age_days(r) -> int:
        if pd.isna(r["Create Date"]):
            return 0
        return int((today - r["Create Date"].normalize()).days)

    def row_days_since_activity(r):
        if pd.isna(r["Last Activity Date"]):
            return None
        return int((today - r["Last Activity Date"]).days)

    months = sorted(df["close_month"].dropna().unique())
    cats = ["Upside", "Pipeline", "Closed Won", "Not Forecasted"]
    chart = []
    for cat in cats:
        points = []
        for m in months:
            mask = (df["category_group"] == cat) & (df["close_month"] == m)
            amt = float(df.loc[mask, "Amount"].sum())
            month_start = pd.Timestamp(f"{m}-01")
            points.append({"key": month_start.isoformat(), "data": amt})
        chart.append({"key": cat, "data": points})

    deals = []
    for _, r in df.iterrows():
        cat = cat_key(r["Forecast category"])
        w = float(r["Amount"]) * CATEGORY_WEIGHTS.get(cat, 0.1)
        age_days = row_age_days(r)
        dsa = row_days_since_activity(r)
        deals.append(
            {
                "id": str(r["Record ID"]),
                "name": str(r["Deal Name"]) if pd.notna(r["Deal Name"]) else "",
                "amount": float(r["Amount"]),
                "weightedAmount": round(w, 2),
                "closeDate": r["Close Date"].isoformat() if pd.notna(r["Close Date"]) else None,
                "createDate": r["Create Date"].isoformat() if pd.notna(r["Create Date"]) else None,
                "ageDays": age_days,
                "daysSinceActivity": dsa if dsa is not None else None,
                "country": str(r["Company country name"])
                if pd.notna(r["Company country name"])
                else "",
                "category": cat,
                "stage": str(r["Deal Stage"]) if pd.notna(r["Deal Stage"]) else "",
                "partner": (
                    str(r["Partner name"])
                    if pd.notna(r["Partner name"])
                    else (str(r["Associated Partner"]) if pd.notna(r["Associated Partner"]) else "")
                ),
                "employees": int(r["Revised number of employees"])
                if pd.notna(r["Revised number of employees"])
                else None,
                "activities": int(r["Number of Sales Activities"])
                if pd.notna(r["Number of Sales Activities"])
                else 0,
                "lastActivity": r["Last Activity Date"].isoformat()
                if pd.notna(r["Last Activity Date"])
                else None,
                "nextStep": str(r["Next step"])[:280] if pd.notna(r["Next step"]) else "",
                "closeMonthKey": str(r["close_month"]) if pd.notna(r["close_month"]) else "",
            }
        )

    upside = df[df["category_group"] == "Upside"]
    pipeline = df[df["category_group"] == "Pipeline"]
    closed = df[df["category_group"] == "Closed Won"]
    not_fc = df[df["category_group"] == "Not Forecasted"]

    month_deals = df[df["close_month"] == month_key].copy()

    secured = float(
        month_deals.loc[month_deals["category_group"] == "Closed Won", "Amount"].sum()
    )
    weighted_month = float(
        sum(
            row["Amount"] * CATEGORY_WEIGHTS.get(row["category_group"], 0.1)
            for _, row in month_deals.iterrows()
        )
    )
    gap = max(0.0, MONTHLY_GOAL_EUR - weighted_month)
    progress_pct = min(100.0, round((weighted_month / MONTHLY_GOAL_EUR) * 100, 1))
    secured_pct = min(100.0, round((secured / MONTHLY_GOAL_EUR) * 100, 1))

    raw_chance = (weighted_month / MONTHLY_GOAL_EUR) * 72 + (secured / MONTHLY_GOAL_EUR) * 28
    win_chance = int(min(92, max(8, round(raw_chance))))

    days_in_month = (today + pd.offsets.MonthEnd(0)).day
    day_of_month = today.day
    run_rate = (secured / day_of_month) * days_in_month if day_of_month > 0 else 0
    projected_month = round(min(run_rate + weighted_month - secured, MONTHLY_GOAL_EUR * 2), 0)

    month_start = pd.Timestamp(f"{month_key}-01")
    trend_points = []
    cumulative_secured = 0.0
    cumulative_weighted = 0.0
    for week in range(1, 6):
        week_end = month_start + pd.Timedelta(days=week * 7)
        week_mask = (month_deals["Close Date"] >= month_start) & (
            month_deals["Close Date"] < week_end
        )
        week_df = month_deals.loc[week_mask]
        w_secured = float(
            week_df.loc[week_df["category_group"] == "Closed Won", "Amount"].sum()
        )
        w_weighted = float(
            sum(
                row["Amount"] * CATEGORY_WEIGHTS.get(row["category_group"], 0.1)
                for _, row in week_df.iterrows()
            )
        )
        cumulative_secured += w_secured
        cumulative_weighted += w_weighted
        trend_points.append(
            {
                "week": f"W{week}",
                "secured": round(cumulative_secured, 2),
                "weighted": round(cumulative_weighted, 2),
                "goal": MONTHLY_GOAL_EUR,
            }
        )

    if len(trend_points) >= 2 and day_of_month > 0:
        last_w = trend_points[min(len(trend_points) - 1, max(1, (day_of_month - 1) // 7))]
        slope = last_w["weighted"] / max(day_of_month, 1)
        for i, pt in enumerate(trend_points):
            projected = round(slope * min(days_in_month, (i + 1) * 7), 2)
            pt["trend"] = projected
    else:
        for pt in trend_points:
            pt["trend"] = pt["weighted"]

    # Pipeline health
    created_this_month = df[df["create_month"] == month_key]
    created_this_month_eur = float(created_this_month["Amount"].sum())

    open_mask = df["category_group"] != "Closed Won"
    open_df = df.loc[open_mask]
    if len(open_df) > 0:
        ages = [
            int((today - r["Create Date"].normalize()).days)
            for _, r in open_df.iterrows()
            if pd.notna(r["Create Date"])
        ]
        avg_age_days = round(sum(ages) / len(ages), 1) if ages else 0.0
    else:
        avg_age_days = 0.0

    stale_list = []
    for _, r in df.iterrows():
        cat = r["category_group"]
        age_d = row_age_days(r)
        dsa = row_days_since_activity(r)
        stage = str(r["Deal Stage"]) if pd.notna(r["Deal Stage"]) else ""
        if not deal_is_stale(cat, age_d, dsa, stage):
            continue
        stale_list.append(
            {
                "id": str(r["Record ID"]),
                "name": str(r["Deal Name"]) if pd.notna(r["Deal Name"]) else "",
                "amount": float(r["Amount"]),
                "stage": stage,
                "ageDays": age_d,
                "daysSinceActivity": dsa,
                "category": cat,
            }
        )
    stale_list = sorted(stale_list, key=lambda x: (-(x["ageDays"] or 0), -x["amount"]))[:5]

    priority_deals = []
    for _, r in month_deals.sort_values("Amount", ascending=False).iterrows():
        if r["category_group"] == "Closed Won":
            continue
        priority_deals.append(
            {
                "id": str(r["Record ID"]),
                "name": str(r["Deal Name"]),
                "amount": float(r["Amount"]),
                "category": r["category_group"],
                "weighted": round(
                    float(r["Amount"])
                    * CATEGORY_WEIGHTS.get(r["category_group"], 0.1),
                    2,
                ),
                "closeDate": r["Close Date"].strftime("%Y-%m-%d")
                if pd.notna(r["Close Date"])
                else None,
                "nextStep": str(r["Next step"])[:200] if pd.notna(r["Next step"]) else "",
            }
        )

    # Executive bullets (template-based)
    top_priority = priority_deals[0] if priority_deals else None
    bullets = [
        f"Monthly goal €{MONTHLY_GOAL_EUR:,.0f}: {progress_pct:.0f}% by weighted forecast — "
        f"€{secured:,.0f} secured, €{weighted_month:,.0f} weighted ({month_key}).",
        f"Estimated chance to reach goal this month: ~{win_chance}%. Gap to target: €{gap:,.0f}.",
    ]
    if top_priority:
        bullets.append(
            f"Largest upside this month on the board: «{top_priority['name']}» "
            f"({top_priority['amount']:,.0f} € nominal, €{top_priority['weighted']:,.0f} weighted)."
        )
    bullets.append(
        f"Pipe created (by create date) in {today.strftime('%B')}: €{created_this_month_eur:,.0f} "
        f"({len(created_this_month)} deals)."
    )
    stale_n = sum(
        deal_is_stale(
            cat_key(r["Forecast category"]),
            row_age_days(r),
            row_days_since_activity(r),
            str(r["Deal Stage"]) if pd.notna(r["Deal Stage"]) else "",
        )
        for _, r in df.iterrows()
    )
    bullets.append(
        f"Deals flagged for attention (stale or early-stage + dormant): {stale_n}. "
        f"Forecast detail and edits: HubSpot."
    )

    payload = {
        "meta": {
            "owner": "Victor Gutierrez",
            "role": "Partner Account Executive",
            "team": "ROW",
            "exportedAt": pd.Timestamp.now().strftime("%Y-%m-%d"),
            "source": "HubSpot CRM — Forecast Control",
            "briefTitle": "ROW Pipeline Brief",
            "hubspotForecastUrl": str(dash_cfg.get("hubspotForecastUrl") or ""),
            "hubspotPortalId": str(dash_cfg.get("hubspotPortalId") or ""),
            "hubspotDealBaseOrigin": str(dash_cfg.get("hubspotDealBaseOrigin") or ""),
        },
        "summary": {
            "totalDeals": len(df),
            "totalPipeline": round(float(df["Amount"].sum()), 2),
            "upsideValue": round(float(upside["Amount"].sum()), 2),
            "upsideCount": int(len(upside)),
            "pipelineValue": round(float(pipeline["Amount"].sum()), 2),
            "pipelineCount": int(len(pipeline)),
            "closedWonValue": round(float(closed["Amount"].sum()), 2),
            "closedWonCount": int(len(closed)),
            "notForecastedValue": round(float(not_fc["Amount"].sum()), 2),
            "notForecastedCount": int(len(not_fc)),
            "avgDealSize": round(float(df["Amount"].mean()), 2),
            "totalActivities": int(df["Number of Sales Activities"].sum()),
            "countries": sorted(df["Company country name"].dropna().unique().tolist()),
        },
        "pipelineHealth": {
            "month": month_key,
            "monthLabel": today.strftime("%B %Y"),
            "createdThisMonthEur": round(created_this_month_eur, 2),
            "createdThisMonthCount": int(len(created_this_month)),
            "avgDealAgeDays": avg_age_days,
            "staleDealCount": int(stale_n),
            "staleDeals": stale_list[:5],
        },
        "executiveBullets": bullets,
        "chartSeries": chart,
        "chartMonths": months,
        "goal": {
            "targetEur": MONTHLY_GOAL_EUR,
            "month": month_key,
            "monthLabel": today.strftime("%B %Y"),
            "securedEur": round(secured, 2),
            "weightedEur": round(weighted_month, 2),
            "gapEur": round(gap, 2),
            "progressPct": progress_pct,
            "securedPct": secured_pct,
            "winChancePct": win_chance,
            "projectedEur": projected_month,
            "daysLeft": int(days_in_month - day_of_month),
            "trend": trend_points,
            "priorityDeals": priority_deals[:5],
        },
        "deals": sorted(
            deals,
            key=lambda d: (-(d.get("closeMonthKey") == month_key), -d["weightedAmount"]),
        ),
    }

    out = root / "public" / "data" / "pipeline.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {out} ({len(deals)} deals)")


if __name__ == "__main__":
    main()
