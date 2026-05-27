"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, RefreshCw, Trash2, Upload } from "lucide-react";
import { generatePipelineFromExcelFile } from "@/lib/hubspot-export/generate-pipeline";
import { loadDashboardConfig } from "@/lib/hubspot-export/load-dashboard-config";
import { HubSpotImportError } from "@/lib/hubspot-export/read-excel";
import type { PipelineData } from "@/lib/pipeline-types";
import { cn, formatDisplayDate } from "@/lib/utils";

type Props = {
  dataSource: "bundled" | "upload";
  pipeline: PipelineData;
  uploadFileName?: string;
  uploadAt?: string;
  onImportSuccess: (data: PipelineData, fileName: string) => void;
  onClearUpload: () => void;
};

export default function HubSpotImportPanel({
  dataSource,
  pipeline,
  uploadFileName,
  uploadAt,
  onImportSuccess,
  onClearUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.name.match(/\.xlsx?$/i)) {
      setError("Use um ficheiro Excel (.xlsx) exportado do HubSpot.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const config = await loadDashboardConfig();
      const next = await generatePipelineFromExcelFile(file, config);
      onImportSuccess(next, file.name);
      setSuccess(
        `Atualizado com ${next.deals.length} deals a partir de «${file.name}». O dashboard já mostra estes dados.`,
      );
    } catch (e) {
      const msg =
        e instanceof HubSpotImportError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Não foi possível processar o Excel. Tente exportar de novo do HubSpot.";
      setError(msg);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(pipeline, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pipeline.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      className="mx-4 mt-6 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 shadow-sm"
      aria-label="Importar exportação HubSpot"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-emerald-950 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Atualizar dados sem Cursor
          </h2>
          <p className="text-sm text-emerald-900/80 max-w-2xl">
            Exporte a vista <strong>Forecast Control</strong> no HubSpot como Excel, depois carregue aqui.
            O site processa o ficheiro no seu browser — não precisa de API HubSpot.
          </p>
          <p className="text-xs text-emerald-800/70">
            {dataSource === "upload" && uploadFileName ? (
              <>
                A mostrar upload: <strong>{uploadFileName}</strong>
                {uploadAt ? ` · ${formatDisplayDate(uploadAt)}` : null} · {pipeline.deals.length} deals
              </>
            ) : (
              <>
                A mostrar dados publicados no site ({pipeline.deals.length} deals). Faça upload para ver
                números mais recentes.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium",
              "bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-60",
            )}
          >
            {busy ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {busy ? "A processar…" : "Carregar Excel do HubSpot"}
          </button>
          {dataSource === "upload" ? (
            <>
              <button
                type="button"
                onClick={downloadJson}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2.5 text-sm text-emerald-900 hover:bg-emerald-50"
              >
                <Download className="w-4 h-4" />
                Descarregar JSON
              </button>
              <button
                type="button"
                onClick={onClearUpload}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2.5 text-sm text-emerald-900 hover:bg-emerald-50"
              >
                <Trash2 className="w-4 h-4" />
                Voltar aos publicados
              </button>
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 text-sm text-emerald-900 bg-white/70 border border-emerald-200 rounded-lg px-3 py-2">
          {success}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-emerald-800/75">
        <strong>Manager no link público?</strong> O upload fica neste browser até limpar. Para atualizar o
        site no GitHub: descarregue JSON → substitua{" "}
        <code className="bg-white/60 px-1 rounded">public/data/pipeline.json</code> → push (ou peça ajuda
        nesse passo).
      </p>
    </section>
  );
}
