import * as XLSX from "xlsx";
import { REQUIRED_HUBSPOT_COLUMNS } from "./constants";
import type { HubSpotRow } from "./helpers";

export class HubSpotImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HubSpotImportError";
  }
}

export async function readHubSpotExportRows(file: File): Promise<{
  rows: HubSpotRow[];
  columns: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new HubSpotImportError("O ficheiro Excel está vazio — exporte de novo a vista Forecast Control no HubSpot.");
  }
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new HubSpotImportError("Não foi possível ler a primeira folha do Excel.");
  }

  const raw = XLSX.utils.sheet_to_json<HubSpotRow>(sheet, { defval: null, raw: false });
  if (!raw.length) {
    throw new HubSpotImportError("A exportação não tem linhas de deals — confirme a vista no HubSpot.");
  }

  const rows = raw.map((row) => {
    const normalized: HubSpotRow = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[String(key).trim()] = value;
    }
    return normalized;
  });

  const columns = Object.keys(rows[0] ?? {});
  const missing = REQUIRED_HUBSPOT_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length) {
    throw new HubSpotImportError(
      `Exportação incompleta — faltam colunas: ${missing.join(", ")}. Use a mesma vista Forecast Control do HubSpot.`,
    );
  }

  return { rows, columns };
}
