# ROW Pipeline Brief — Victor Gutierrez

Landing para **brief semanal** com o manager: meta mensal em €, resumo executivo, saúde do pipeline (datas de criação e atividade), gráficos e lista de deals. O **forecast oficial continua no HubSpot** — esta página é o snapshot estável antes do 1:1.

**Site em produção:** https://victorhgutierrez-cloud.github.io/victorgutierrezforecastcontrol/

## Fluxo recomendado (toque antes do 1:1)

1. No HubSpot, exportar a vista **Forecast Control** como `.xlsx`.
2. Substituir o ficheiro na raiz do repo (nome actual do script por defeito: `hubspot-crm-exports-forecast-control-2026-05-19.xlsx`, ou passar outro nome ao comando).
3. Correr `npm run generate-data` (regenera `public/data/pipeline.json` incluindo textos para o manager).
4. `git add .`, commit, `git push` para `main` — o GitHub Actions republica em ~3–5 minutos.
5. Enviar o link do Pages ao manager; durante a semana, alterações de forecast **só no HubSpot**.

## Configurar HubSpot na página

Edite **[`public/data/dashboard-config.json`](public/data/dashboard-config.json)**:

| Campo | Para quê |
|-------|----------|
| `hubspotForecastUrl` | URL completa para abrir forecast / pipeline no HubSpot (botão no cabeçalho). |
| `hubspotPortalId` | ID numérico do portal (opcional mas recomendado) — permite links directos aos deals nos blocos Focus e Needs attention (`/contacts/{id}/deal/{dealId}`). |
| `hubspotDealBaseOrigin` | Origem HTTPS do portal (opcional): ex. `https://app-eu1.hubspot.com` se o Forecast abre na região EU; quando vazio usa `https://app.hubspot.com`. |

Depois de alterar este ficheiro, volte a correr **`npm run generate-data`** para fundir valores em `pipeline.json`.

## Métricas (resumo)

- **Secured**: valor a 100 % dos Closed Won no mês (data de fecho).
- **Weighted**: cada deal × peso por categoria (Upside ~55 %, Pipeline ~25 %, Not forecasted ~8 % — ver `scripts/generate-pipeline-data.py`).
- **Pipeline health**: pipe criado no mês calendar (create date), idade média dos deals abertos, lista “attention” por regra de staleness (~30 dias + actividade baixa ou estágio muito inicial).
- Bullets da secção **Executive summary** são gerados em Python a partir do export (sem IA).

## Desenvolvimento local

```bash
npm install
npm run generate-data
npm run dev
```

http://localhost:3000  

Meta mensal €2 000 está em `MONTHLY_GOAL_EUR` em [`scripts/generate-pipeline-data.py`](scripts/generate-pipeline-data.py).

## GitHub Pages

1. Repo → **Settings → Pages** → **Source: GitHub Actions**.
2. Push em `main` — workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

Variável opcional ao build estático: `NEXT_PUBLIC_SITE_URL` (URL pública impressa no rodapé).

## Estrutura útil

| Caminho | Função |
|---------|--------|
| `hubspot-crm-exports-*.xlsx` | Export do HubSpot |
| `public/data/dashboard-config.json` | URL HubSpot + portal ID |
| `scripts/generate-pipeline-data.py` | Excel → `pipeline.json` |
| `public/data/pipeline.json` | Snapshot consumido pela app |
| `src/components/` | Executive summary, goal, charts, pipeline health, tabela |

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Recharts, Framer Motion.
