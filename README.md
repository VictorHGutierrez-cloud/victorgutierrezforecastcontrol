# ROW Pipeline Brief — Victor Gutierrez

Landing page for your **weekly manager brief**: monthly quota in EUR, executive summary, pipeline health (create dates and activity), charts, and deal list. **Official forecast stays in HubSpot** — this page is the stable snapshot before your 1:1.

**Live site:** https://victorhgutierrez-cloud.github.io/victorgutierrezforecastcontrol/

## Recommended workflow (refresh before 1:1)

### Easiest: upload on the live site (no Cursor)

1. In HubSpot, export the **Forecast Control** view as `.xlsx`.
2. Open your dashboard URL (local `npm run dev` or GitHub Pages).
3. Use the green **“Carregar Excel do HubSpot”** box at the top — pick the file.
4. The page updates immediately in **your browser** (data is stored in local storage until you clear it).

**Manager on the public link?** Upload is per-browser. To refresh the shared site: click **Descarregar JSON**, replace `public/data/pipeline.json` in the repo, then `git push` (or ask for help once).

### Optional: update via repo (same as before)

1. Save the export as **`novoexport1.xlsx`** in the repo root (or pass a path: `npm run generate-data -- /path/to/export.xlsx`).
2. Run `npm run generate-data` (regenerates `public/data/pipeline.json`).
3. `git add .`, commit, `git push` to `main` — GitHub Actions republishes in ~3–5 minutes.

During the week, forecast changes **only in HubSpot**; this page is your snapshot for 1:1s.

## Configure HubSpot on the page

Edit **[`public/data/dashboard-config.json`](public/data/dashboard-config.json)**:

| Field | Purpose |
|-------|---------|
| `hubspotForecastUrl` | Full URL to open forecast / pipeline in HubSpot (header button). |
| `hubspotPortalId` | Numeric portal ID (optional but recommended) — enables direct deal links in Focus and Needs attention (`/contacts/{id}/deal/{dealId}`). |
| `hubspotDealBaseOrigin` | Portal HTTPS origin (optional): e.g. `https://app-eu1.hubspot.com` if Forecast opens in the EU region; when empty, uses `https://app.hubspot.com`. |
| `monthlyQuotaEur` | Monthly target in EUR written into `pipeline.json` when you generate data (default 2000 in the script if missing or invalid). On the page you can use the **Monthly quota** slider for temporary what-if scenarios (saved in the browser). |

After changing this file, run **`npm run generate-data`** again to merge values into `pipeline.json`.

## Charts (Subframe)

- Base component: [`src/components/ui/area-chart.tsx`](src/components/ui/area-chart.tsx) (wrapper over `@subframe/core`).
- **Pipeline reports** section on the dashboard: momentum, pipeline by close month, mix by category, countries.
- Dependency: `@subframe/core` (already in `package.json`).

## Metrics (summary)

- **Secured**: 100% of Closed Won value in the month (close date).
- **Weighted**: each deal × category weight (Upside ~55%, Pipeline ~25%, Not forecasted ~8% — see `scripts/generate-pipeline-data.py`).
- **Gap to close**: target − secured (cash still needed — best for 1:1).
- **Gap (forecast)**: target − weighted (includes open-deal forecast with HubSpot weights).
- **Pipeline health**: pipe created this month, average age, **deal score** and **valid touchpoints** (HubSpot export), “needs attention” list with plain-language reasons. Deals with a **future activity scheduled** are not flagged as stale.
- Extra export fields (when present): Last Contacted, Next activity date, Demo Status, Outbound Category, etc. — the script maps them automatically.
- **Executive summary** bullets are generated in Python from the export (no AI).
- **Conversion rate (snapshot)** and **average sales cycle**: see the **Conversion & sales cycle** block on the page — computed in `generate-pipeline-data.py`: closed won ÷ (Closed won + Upside + Pipeline) excluding stages whose text contains `First Demo`; cycle = average days from create to close on wins (uses HubSpot column *Time Between Creation and Closed Date* when present).

## Local development

```bash
npm install
npm run generate-data
npm run dev
```

http://localhost:3000

**Monthly quota:** `monthlyQuotaEur` in [`public/data/dashboard-config.json`](public/data/dashboard-config.json); the generator [`scripts/generate-pipeline-data.py`](scripts/generate-pipeline-data.py) reads that value (fallback €2,000). The page slider only simulates another quota in the browser (localStorage); for a shared URL or refresh with the same number, update config + run `npm run generate-data` + push.

## GitHub Pages

1. Repo → **Settings → Pages** → **Source: GitHub Actions**.
2. Push to `main` — workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

Optional build variable for static export: `NEXT_PUBLIC_SITE_URL` (public URL shown in the footer).

## Useful paths

| Path | Role |
|------|------|
| `novoexport.xlsx` | HubSpot export (default name for the generator) |
| `hubspot-crm-exports-*.xlsx` | Previous export (reference) |
| `public/data/dashboard-config.json` | HubSpot URL, EU portal, **monthlyQuotaEur** (target baked in when generating data) |
| `scripts/generate-pipeline-data.py` | Excel → `pipeline.json` |
| `public/data/pipeline.json` | Snapshot consumed by the app |
| `src/components/` | Executive summary, goal, charts, pipeline health, table |

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Recharts, Framer Motion.
