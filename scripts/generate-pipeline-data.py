#!/usr/bin/env python3
"""Convert HubSpot Forecast Control export to pipeline.json for the dashboard."""

import json
import sys
from pathlib import Path

import pandas as pd


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


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    xlsx = root / "hubspot-crm-exports-forecast-control-2026-05-19.xlsx"
    if len(sys.argv) > 1:
        xlsx = Path(sys.argv[1])

    df = pd.read_excel(xlsx)
    df.columns = [str(c).strip() for c in df.columns]

    for col in ["Close Date", "Create Date", "Last Activity Date"]:
        df[col] = pd.to_datetime(df[col], errors="coerce")
    df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce").fillna(0)
    df["category_group"] = df["Forecast category"].apply(cat_key)
    df["close_month"] = df["Close Date"].dt.strftime("%Y-%m")

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
        deals.append(
            {
                "id": str(r["Record ID"]),
                "name": str(r["Deal Name"]) if pd.notna(r["Deal Name"]) else "",
                "amount": float(r["Amount"]),
                "closeDate": r["Close Date"].isoformat() if pd.notna(r["Close Date"]) else None,
                "country": str(r["Company country name"]) if pd.notna(r["Company country name"]) else "",
                "category": cat_key(r["Forecast category"]),
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
            }
        )

    upside = df[df["category_group"] == "Upside"]
    pipeline = df[df["category_group"] == "Pipeline"]
    closed = df[df["category_group"] == "Closed Won"]
    not_fc = df[df["category_group"] == "Not Forecasted"]

    payload = {
        "meta": {
            "owner": "Victor Gutierrez",
            "role": "Partner Account Executive",
            "team": "ROW",
            "exportedAt": pd.Timestamp.now().strftime("%Y-%m-%d"),
            "source": "HubSpot CRM — Forecast Control",
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
        "chartSeries": chart,
        "chartMonths": months,
        "deals": sorted(deals, key=lambda x: x["amount"], reverse=True),
    }

    out = root / "public" / "data" / "pipeline.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {out} ({len(deals)} deals)")


if __name__ == "__main__":
    main()
