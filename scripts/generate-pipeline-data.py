#!/usr/bin/env python3
"""Convert HubSpot Forecast Control export to pipeline.json for the dashboard."""

import json
import sys
from pathlib import Path
from typing import Any, Optional

import pandas as pd


MONTHLY_GOAL_DEFAULT_EUR = 2000
DEFAULT_EXPORT = "novoexport.xlsx"
CATEGORY_WEIGHTS = {
    "Closed Won": 1.0,
    "Upside": 0.55,
    "Pipeline": 0.25,
    "Not Forecasted": 0.08,
    "Other": 0.1,
}

# HubSpot column names → internal keys (optional columns ignored if missing)
OPTIONAL_DATE_COLUMNS = {
    "Last Contacted": "lastContacted",
    "Next activity date": "nextActivityDate",
    "Next activity date including sequences": "nextActivityDate",
    "Demo date": "demoDate",
    "Date entered current stage": "stageEnteredDate",
    "Closed Date": "closeDate",
}

OPTIONAL_SCALAR_COLUMNS = {
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
        "monthlyQuotaEur": None,
    }
    if not cfg_path.exists():
        return defaults
    try:
        merged = {**defaults, **json.loads(cfg_path.read_text())}
        return merged
    except json.JSONDecodeError:
        return defaults


def monthly_goal_from_config(cfg: dict) -> float:
    """EUR monthly quota; synced with dashboard `monthlyQuotaEur`."""
    raw = cfg.get("monthlyQuotaEur")
    if raw is None or raw == "":
        return float(MONTHLY_GOAL_DEFAULT_EUR)
    try:
        v = float(raw)
        if v <= 0:
            return float(MONTHLY_GOAL_DEFAULT_EUR)
        return v
    except (ValueError, TypeError):
        return float(MONTHLY_GOAL_DEFAULT_EUR)


def col_present(df: pd.DataFrame, name: str) -> bool:
    return name in df.columns


def safe_str(val: object, max_len: Optional[int] = None) -> str:
    if pd.isna(val):
        return ""
    s = str(val).strip()
    if max_len and len(s) > max_len:
        return s[:max_len]
    return s


def safe_int(val: object) -> Optional[int]:
    if pd.isna(val):
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def safe_float(val: object) -> Optional[float]:
    if pd.isna(val):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def iso_or_none(ts: object) -> Optional[str]:
    if pd.isna(ts):
        return None
    try:
        return pd.Timestamp(ts).isoformat()
    except (ValueError, TypeError):
        return None


def days_between(today: pd.Timestamp, dt: object) -> Optional[int]:
    if pd.isna(dt):
        return None
    try:
        return int((today - pd.Timestamp(dt).normalize()).days)
    except (ValueError, TypeError):
        return None


def has_scheduled_activity(next_activity: object, today: pd.Timestamp) -> bool:
    if pd.isna(next_activity):
        return False
    try:
        return pd.Timestamp(next_activity).normalize() >= today
    except (ValueError, TypeError):
        return False


def effective_days_since_contact(
    days_since_activity: Optional[int],
    days_since_valid_touch: Optional[int],
) -> Optional[int]:
    """Prefer valid touchpoint recency when available."""
    if days_since_valid_touch is not None and days_since_activity is not None:
        return min(days_since_valid_touch, days_since_activity)
    if days_since_valid_touch is not None:
        return days_since_valid_touch
    return days_since_activity


def deal_is_stale(
    cat: str,
    age_days: int,
    days_since_activity: Optional[int],
    stage: str,
    *,
    days_since_valid_touch: Optional[int] = None,
    next_activity_date: object = None,
    today: Optional[pd.Timestamp] = None,
) -> bool:
    if cat == "Closed Won":
        return False
    if today is not None and has_scheduled_activity(next_activity_date, today):
        return False

    stage_l = stage.lower()
    early_stage = "new deals" in stage_l or stage_l.startswith("demo")
    contact_gap = effective_days_since_contact(days_since_activity, days_since_valid_touch)
    dormant = (contact_gap is not None and contact_gap >= 14) or (
        contact_gap is None and age_days >= 14
    )
    if age_days < 30:
        return False
    return dormant or early_stage


def stale_reason(
    cat: str,
    age_days: int,
    days_since_activity: Optional[int],
    stage: str,
    *,
    days_since_valid_touch: Optional[int] = None,
    next_activity_date: object = None,
    today: Optional[pd.Timestamp] = None,
    deal_score: Optional[float] = None,
    valid_touchpoints: Optional[int] = None,
) -> str:
    if cat == "Closed Won":
        return ""
    if today is not None and has_scheduled_activity(next_activity_date, today):
        return ""
    stage_l = stage.lower()
    contact_gap = effective_days_since_contact(days_since_activity, days_since_valid_touch)
    parts = []
    if "new deals" in stage_l or stage_l.startswith("demo"):
        parts.append("early stage")
    if contact_gap is not None and contact_gap >= 14:
        parts.append(f"no meaningful contact in {contact_gap}d")
    elif contact_gap is None and age_days >= 14:
        parts.append("no activity or touchpoint dates")
    if valid_touchpoints is not None and valid_touchpoints <= 1:
        parts.append("low touchpoints")
    if deal_score is not None and deal_score < 40:
        parts.append("low deal score")
    return " · ".join(parts) if parts else "needs follow-up"


def is_first_demo_stage(stage: object) -> bool:
    """Exclude pipeline rows whose HubSpot Deal Stage text includes First Demo (case-insensitive)."""
    return "first demo" in safe_str(stage).lower()


def parse_optional_columns(df: pd.DataFrame) -> pd.DataFrame:
    for hubspot_col in OPTIONAL_DATE_COLUMNS:
        if col_present(df, hubspot_col):
            df[hubspot_col] = pd.to_datetime(df[hubspot_col], errors="coerce")
    return df


def export_column_report(df: pd.DataFrame, old_cols: set) -> dict:
    present = set(df.columns)
    new_cols = sorted(present - old_cols)
    optional_used = [
        c for c in {**OPTIONAL_DATE_COLUMNS, **OPTIONAL_SCALAR_COLUMNS} if c in present
    ]
    fill_rates = {}
    for c in df.columns:
        fill_rates[c] = round(float(df[c].notna().mean()) * 100, 1)
    return {
        "columnCount": len(present),
        "newColumns": new_cols,
        "optionalHubspotColumnsFound": optional_used,
        "fillRatesPct": fill_rates,
    }


def row_optional_fields(r: pd.Series, today: pd.Timestamp) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for hubspot_col, key in OPTIONAL_DATE_COLUMNS.items():
        if hubspot_col not in r.index:
            continue
        val = r[hubspot_col]
        out[key] = iso_or_none(val)
        if key == "nextActivityDate":
            out["hasScheduledActivity"] = has_scheduled_activity(val, today)
    for hubspot_col, key in OPTIONAL_SCALAR_COLUMNS.items():
        if hubspot_col not in r.index:
            continue
        val = r[hubspot_col]
        if key in ("outboundCalls", "attemptCount", "daysCreationToClose"):
            out[key] = safe_int(val)
        elif key == "inContactWithDecisionMaker":
            if pd.isna(val):
                out[key] = None
            else:
                s = str(val).strip().lower()
                out[key] = s in ("true", "yes", "1")
        else:
            out[key] = safe_str(val, 120) or None
    return out


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    xlsx = root / DEFAULT_EXPORT
    if len(sys.argv) > 1:
        xlsx = Path(sys.argv[1])
    if not xlsx.is_absolute():
        xlsx = root / xlsx

    old_export = root / "hubspot-crm-exports-forecast-control-2026-05-19.xlsx"
    old_cols: set = set()
    if old_export.exists():
        old_cols = set(pd.read_excel(old_export, nrows=0).columns)

    dash_cfg = load_dashboard_config(root)
    monthly_goal_eur = monthly_goal_from_config(dash_cfg)

    df = pd.read_excel(xlsx)
    df.columns = [str(c).strip() for c in df.columns]
    column_report = export_column_report(df, old_cols)

    for col in ["Close Date", "Create Date", "Last Activity Date", "Evaluation stage date", "Last Valid Touchpoint"]:
        if col_present(df, col):
            df[col] = pd.to_datetime(df[col], errors="coerce")
    df = parse_optional_columns(df)

    df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce").fillna(0)
    if col_present(df, "Deal Score"):
        df["Deal Score"] = pd.to_numeric(df["Deal Score"], errors="coerce")
    if col_present(df, "Number of Valid Touchpoints"):
        df["Number of Valid Touchpoints"] = pd.to_numeric(
            df["Number of Valid Touchpoints"], errors="coerce"
        )

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
        return days_between(today, r.get("Last Activity Date"))

    def row_days_since_valid_touch(r):
        if not col_present(df, "Last Valid Touchpoint"):
            return None
        return days_between(today, r.get("Last Valid Touchpoint"))

    def row_days_in_evaluation(r):
        if not col_present(df, "Evaluation stage date"):
            return None
        return days_between(today, r.get("Evaluation stage date"))

    def row_next_activity(r):
        for col in ("Next activity date including sequences", "Next activity date"):
            if col_present(df, col):
                return r.get(col)
        return None

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
        dsvt = row_days_since_valid_touch(r)
        deal_score = safe_float(r["Deal Score"]) if col_present(df, "Deal Score") else None
        touchpoints = safe_int(r["Number of Valid Touchpoints"]) if col_present(
            df, "Number of Valid Touchpoints"
        ) else None
        next_act = row_next_activity(r)

        deal: dict[str, Any] = {
            "id": str(r["Record ID"]),
            "name": safe_str(r["Deal Name"]),
            "amount": float(r["Amount"]),
            "weightedAmount": round(w, 2),
            "closeDate": iso_or_none(r["Close Date"]),
            "createDate": iso_or_none(r["Create Date"]),
            "ageDays": age_days,
            "daysSinceActivity": dsa,
            "daysSinceValidTouchpoint": dsvt,
            "country": safe_str(r["Company country name"]),
            "category": cat,
            "stage": safe_str(r["Deal Stage"]),
            "partner": safe_str(r["Partner name"]) or safe_str(r["Associated Partner"]),
            "employees": safe_int(r["Revised number of employees"]),
            "activities": safe_int(r["Number of Sales Activities"]) or 0,
            "lastActivity": iso_or_none(r["Last Activity Date"]),
            "nextStep": safe_str(r["Next step"], 280),
            "closeMonthKey": str(r["close_month"]) if pd.notna(r["close_month"]) else "",
            "dealScore": deal_score,
            "evaluationStageDate": iso_or_none(r["Evaluation stage date"])
            if col_present(df, "Evaluation stage date")
            else None,
            "daysInEvaluation": row_days_in_evaluation(r),
            "validTouchpoints": touchpoints,
            "lastValidTouchpoint": iso_or_none(r["Last Valid Touchpoint"])
            if col_present(df, "Last Valid Touchpoint")
            else None,
            "isStale": deal_is_stale(
                cat,
                age_days,
                dsa,
                safe_str(r["Deal Stage"]),
                days_since_valid_touch=dsvt,
                next_activity_date=next_act,
                today=today,
            ),
            "engagementRisk": (
                cat != "Closed Won"
                and (
                    (touchpoints is not None and touchpoints <= 1)
                    or (dsvt is not None and dsvt >= 14)
                    or (deal_score is not None and deal_score < 40)
                )
            ),
        }
        deal.update(row_optional_fields(r, today))
        deals.append(deal)

    upside = df[df["category_group"] == "Upside"]
    pipeline = df[df["category_group"] == "Pipeline"]
    closed = df[df["category_group"] == "Closed Won"]
    not_fc = df[df["category_group"] == "Not Forecasted"]

    fd_mask = df["Deal Stage"].map(is_first_demo_stage)
    df_no_first_demo = df.loc[~fd_mask]
    funnel_mask = df_no_first_demo["category_group"].isin(["Closed Won", "Upside", "Pipeline"])
    funnel_df = df_no_first_demo.loc[funnel_mask]
    won_df = funnel_df[funnel_df["category_group"] == "Closed Won"]
    funnel_count = int(len(funnel_df))
    won_count = int(len(won_df))
    conversion_rate_pct = (
        round(100.0 * won_count / funnel_count, 1) if funnel_count > 0 else None
    )
    hub_days_col_present = col_present(df, "Time Between Creation and Closed Date")
    cycle_days: list[int] = []
    for _, r in won_df.iterrows():
        dh: Optional[int] = None
        if hub_days_col_present:
            dh = safe_int(r.get("Time Between Creation and Closed Date"))
        if dh is not None and dh >= 0:
            cycle_days.append(int(dh))
        elif pd.notna(r["Create Date"]) and pd.notna(r["Close Date"]):
            delta = pd.Timestamp(r["Close Date"]).normalize() - pd.Timestamp(r["Create Date"]).normalize()
            cycle_days.append(max(0, int(delta.days)))
    avg_cycle_days = round(float(sum(cycle_days)) / len(cycle_days), 1) if cycle_days else None
    conversion_snapshot = {
        "ratePct": conversion_rate_pct,
        "wonCount": won_count,
        "funnelCount": funnel_count,
        "firstDemoExcludedDealCount": int(fd_mask.sum()),
        "avgSalesCycleDays": avg_cycle_days,
        "cycleSampleCount": int(len(cycle_days)),
        "formulaEn": "won ÷ (Won + Upside + Pipeline) excluding Deal Stage containing First Demo; "
        "cycle = avg days creation→close among those wins.",
    }

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
    gap_secured = max(0.0, monthly_goal_eur - secured)
    gap_weighted = max(0.0, monthly_goal_eur - weighted_month)
    progress_pct = min(100.0, round((weighted_month / monthly_goal_eur) * 100, 1))
    secured_pct = min(100.0, round((secured / monthly_goal_eur) * 100, 1))

    raw_chance = (weighted_month / monthly_goal_eur) * 72 + (secured / monthly_goal_eur) * 28
    win_chance = int(min(92, max(8, round(raw_chance))))

    days_in_month = (today + pd.offsets.MonthEnd(0)).day
    day_of_month = today.day
    run_rate = (secured / day_of_month) * days_in_month if day_of_month > 0 else 0
    projected_month = round(min(run_rate + weighted_month - secured, monthly_goal_eur * 2), 0)

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
                "goal": monthly_goal_eur,
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

    open_deals = [d for d in deals if d["category"] != "Closed Won"]
    scores = [d["dealScore"] for d in open_deals if d.get("dealScore") is not None]
    avg_deal_score = round(sum(scores) / len(scores), 1) if scores else None
    low_score_count = sum(1 for d in open_deals if (d.get("dealScore") or 100) < 40)
    engagement_risk_count = sum(1 for d in open_deals if d.get("engagementRisk"))
    scheduled_followups = sum(1 for d in open_deals if d.get("hasScheduledActivity"))
    no_eval_date_count = sum(
        1
        for d in open_deals
        if d.get("evaluationStageDate") is None and "evaluation" in d.get("stage", "").lower()
    )

    stale_list = []
    stale_n = 0
    for _, r in df.iterrows():
        cat = r["category_group"]
        age_d = row_age_days(r)
        dsa = row_days_since_activity(r)
        dsvt = row_days_since_valid_touch(r)
        stage = safe_str(r["Deal Stage"])
        next_act = row_next_activity(r)
        deal_score = safe_float(r["Deal Score"]) if col_present(df, "Deal Score") else None
        touchpoints = safe_int(r["Number of Valid Touchpoints"]) if col_present(
            df, "Number of Valid Touchpoints"
        ) else None
        if not deal_is_stale(
            cat,
            age_d,
            dsa,
            stage,
            days_since_valid_touch=dsvt,
            next_activity_date=next_act,
            today=today,
        ):
            continue
        stale_n += 1
        reason = stale_reason(
            cat,
            age_d,
            dsa,
            stage,
            days_since_valid_touch=dsvt,
            next_activity_date=next_act,
            today=today,
            deal_score=deal_score,
            valid_touchpoints=touchpoints,
        )
        stale_list.append(
            {
                "id": str(r["Record ID"]),
                "name": safe_str(r["Deal Name"]),
                "amount": float(r["Amount"]),
                "stage": stage,
                "ageDays": age_d,
                "daysSinceActivity": dsa,
                "daysSinceValidTouchpoint": dsvt,
                "category": cat,
                "dealScore": deal_score,
                "validTouchpoints": touchpoints,
                "reason": reason,
            }
        )
    stale_list = sorted(stale_list, key=lambda x: (-(x["ageDays"] or 0), -x["amount"]))[:5]

    priority_deals = []
    for _, r in month_deals.sort_values("Amount", ascending=False).iterrows():
        if r["category_group"] == "Closed Won":
            continue
        d_match = next((d for d in deals if d["id"] == str(r["Record ID"])), None)
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
                "nextStep": safe_str(r["Next step"], 200),
                "dealScore": d_match.get("dealScore") if d_match else None,
                "validTouchpoints": d_match.get("validTouchpoints") if d_match else None,
                "daysSinceValidTouchpoint": d_match.get("daysSinceValidTouchpoint")
                if d_match
                else None,
                "engagementRisk": bool(d_match.get("engagementRisk")) if d_match else False,
            }
        )

    improvement_bullets: list[str] = []
    if engagement_risk_count:
        improvement_bullets.append(
            f"{engagement_risk_count} open deal(s) show engagement risk "
            "(≤1 valid touchpoint, 14+ days since last touch, or score under 40)."
        )
    if low_score_count:
        improvement_bullets.append(
            f"{low_score_count} open deal(s) have HubSpot deal score below 40 — revisit qualification and next steps."
        )
    if scheduled_followups:
        improvement_bullets.append(
            f"{scheduled_followups} open deal(s) already have a future activity scheduled "
            "(excluded from stale flags)."
        )
    if no_eval_date_count:
        improvement_bullets.append(
            f"{no_eval_date_count} deal(s) in evaluation stage missing evaluation date — "
            "add dates in HubSpot for velocity tracking."
        )
    if col_present(df, "Number of Valid Touchpoints"):
        tp_vals = df.loc[open_mask, "Number of Valid Touchpoints"].dropna()
        if len(tp_vals):
            avg_tp = round(float(tp_vals.mean()), 1)
            improvement_bullets.append(
                f"Average valid touchpoints on open deals: {avg_tp} "
                "(aim for steady outbound + discovery touches on upside deals)."
            )

    top_priority = priority_deals[0] if priority_deals else None
    bullets = [
        f"Monthly goal €{monthly_goal_eur:,.0f}: {progress_pct:.0f}% by weighted forecast — "
        f"€{secured:,.0f} secured, €{weighted_month:,.0f} weighted ({month_key}).",
        f"Estimated chance to reach goal this month: ~{win_chance}%. "
        f"Gap to close (secured): €{gap_secured:,.0f} · Gap with forecast: €{gap_weighted:,.0f}.",
    ]
    if top_priority:
        score_bit = ""
        if top_priority.get("dealScore") is not None:
            score_bit = f", score {top_priority['dealScore']:.0f}"
        touch_bit = ""
        if top_priority.get("validTouchpoints") is not None:
            touch_bit = f", {top_priority['validTouchpoints']} valid touchpoint(s)"
        bullets.append(
            f"Largest upside this month: «{top_priority['name']}» "
            f"({top_priority['amount']:,.0f} € nominal, €{top_priority['weighted']:,.0f} weighted"
            f"{score_bit}{touch_bit})."
        )
    bullets.append(
        f"Pipe created (by create date) in {today.strftime('%B')}: €{created_this_month_eur:,.0f} "
        f"({len(created_this_month)} deals)."
    )
    if avg_deal_score is not None:
        bullets.append(
            f"Open pipeline average deal score: {avg_deal_score} "
            f"(HubSpot 0–100; higher = healthier engagement signals)."
        )
    bullets.append(
        f"Deals flagged for attention (stale / early-stage + quiet, excluding scheduled follow-ups): "
        f"{stale_n}. Forecast detail and edits: HubSpot."
    )
    if conversion_snapshot["ratePct"] is not None:
        cyl = (
            f"{conversion_snapshot['avgSalesCycleDays']:.1f}"
            if conversion_snapshot["avgSalesCycleDays"] is not None
            else "—"
        )
        bullets.append(
            f"Conversão snapshot (sem First Demo): {conversion_snapshot['ratePct']:.1f}% "
            f"({conversion_snapshot['wonCount']}/{conversion_snapshot['funnelCount']} Won+Upside+Pipeline). "
            f"Ciclo médio (ganhos fechados): {cyl} dias em {conversion_snapshot['cycleSampleCount']} deal(s)."
        )
    bullets.extend(improvement_bullets[:3])

    payload = {
        "meta": {
            "owner": "Victor Gutierrez",
            "role": "Partner Account Executive",
            "team": "ROW",
            "exportedAt": pd.Timestamp.now().strftime("%Y-%m-%d"),
            "source": f"HubSpot CRM — {xlsx.name}",
            "briefTitle": "ROW Pipeline Brief",
            "hubspotForecastUrl": str(dash_cfg.get("hubspotForecastUrl") or ""),
            "hubspotPortalId": str(dash_cfg.get("hubspotPortalId") or ""),
            "hubspotDealBaseOrigin": str(dash_cfg.get("hubspotDealBaseOrigin") or ""),
            "exportFile": xlsx.name,
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
            "avgDealScore": avg_deal_score,
            "engagementRiskCount": engagement_risk_count,
            "scheduledFollowupCount": scheduled_followups,
        },
        "pipelineHealth": {
            "month": month_key,
            "monthLabel": today.strftime("%B %Y"),
            "createdThisMonthEur": round(created_this_month_eur, 2),
            "createdThisMonthCount": int(len(created_this_month)),
            "avgDealAgeDays": avg_age_days,
            "avgDealScore": avg_deal_score,
            "engagementRiskCount": engagement_risk_count,
            "lowDealScoreCount": low_score_count,
            "scheduledFollowupCount": scheduled_followups,
            "staleDealCount": int(stale_n),
            "staleDeals": stale_list[:5],
            "improvementPoints": improvement_bullets,
        },
        "executiveBullets": bullets,
        "chartSeries": chart,
        "chartMonths": months,
        "conversionSnapshot": conversion_snapshot,
        "goal": {
            "targetEur": monthly_goal_eur,
            "month": month_key,
            "monthLabel": today.strftime("%B %Y"),
            "securedEur": round(secured, 2),
            "weightedEur": round(weighted_month, 2),
            "gapEur": round(gap_secured, 2),
            "gapWeightedEur": round(gap_weighted, 2),
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
        "columnReport": column_report,
    }

    out = root / "public" / "data" / "pipeline.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {out} ({len(deals)} deals) from {xlsx.name}")
    if column_report["newColumns"]:
        print("New columns vs old export:", ", ".join(column_report["newColumns"]))
    if column_report["optionalHubspotColumnsFound"]:
        print(
            "Optional HubSpot columns detected:",
            ", ".join(column_report["optionalHubspotColumnsFound"]),
        )


if __name__ == "__main__":
    main()
