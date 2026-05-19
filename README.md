# Forecast Control — Victor Gutierrez (ROW)

Landing page com relatórios inteligentes do pipeline HubSpot, publicada no **GitHub Pages**.

**Live site:** https://victorhgutierrez-cloud.github.io/victorgutierrezforecastcontrol/

## O que tem neste projeto

- Dashboard visual (gráfico, KPIs, tabela de deals)
- Dados extraídos da planilha HubSpot `Forecast Control`
- Stack: Next.js, TypeScript, Tailwind CSS, shadcn structure, Reaviz, Framer Motion

## Atualizar os dados (passo a passo)

1. No HubSpot, exporte a view **Forecast Control** como `.xlsx`
2. Substitua o arquivo na raiz do projeto (ou renomeie para o mesmo nome)
3. No terminal, na pasta do projeto:

```bash
npm run generate-data
```

4. Envie para o GitHub (`git push`) — o site atualiza automaticamente

## Desenvolvimento local

```bash
npm install
npm run generate-data
npm run dev
```

Abra http://localhost:3000

## Publicar no GitHub Pages

1. No repositório GitHub: **Settings → Pages**
2. **Source:** GitHub Actions
3. Faça push na branch `main` — o workflow `.github/workflows/deploy.yml` publica o site

## Estrutura importante

| Pasta / arquivo | Função |
|---------------|--------|
| `hubspot-crm-exports-*.xlsx` | Export do HubSpot (fonte dos dados) |
| `scripts/generate-pipeline-data.py` | Converte Excel → JSON |
| `public/data/pipeline.json` | Dados usados pelo dashboard |
| `src/components/ui/` | Componentes UI (padrão shadcn) |
