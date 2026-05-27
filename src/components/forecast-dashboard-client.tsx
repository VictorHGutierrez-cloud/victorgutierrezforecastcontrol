"use client";

import { useCallback, useEffect, useState } from "react";
import ForecastDashboardShell from "@/components/forecast-dashboard-shell";
import HubSpotImportPanel from "@/components/hubspot-import-panel";
import type { PipelineData } from "@/lib/pipeline-types";
import {
  clearPipelineUploadStorage,
  loadPipelineFromStorage,
  savePipelineToStorage,
} from "@/lib/pipeline-storage";

type Props = {
  bundledData: PipelineData;
};

export default function ForecastDashboardClient({ bundledData }: Props) {
  const [pipelineData, setPipelineData] = useState<PipelineData>(bundledData);
  const [dataSource, setDataSource] = useState<"bundled" | "upload">("bundled");
  const [uploadFileName, setUploadFileName] = useState<string | undefined>();
  const [uploadAt, setUploadAt] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadPipelineFromStorage();
    if (stored) {
      setPipelineData(stored.pipeline);
      setDataSource("upload");
      setUploadFileName(stored.fileName);
      setUploadAt(stored.uploadedAt);
    }
    setHydrated(true);
  }, []);

  const handleImportSuccess = useCallback((data: PipelineData, fileName: string) => {
    savePipelineToStorage(data, fileName);
    setPipelineData(data);
    setDataSource("upload");
    setUploadFileName(fileName);
    setUploadAt(new Date().toISOString());
  }, []);

  const handleClearUpload = useCallback(() => {
    clearPipelineUploadStorage();
    setPipelineData(bundledData);
    setDataSource("bundled");
    setUploadFileName(undefined);
    setUploadAt(undefined);
  }, [bundledData]);

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center text-slate-500 text-sm">
        A carregar dashboard…
      </main>
    );
  }

  return (
    <>
      <HubSpotImportPanel
        dataSource={dataSource}
        pipeline={pipelineData}
        uploadFileName={uploadFileName}
        uploadAt={uploadAt}
        onImportSuccess={handleImportSuccess}
        onClearUpload={handleClearUpload}
      />
      <ForecastDashboardShell key={dataSource + (uploadAt ?? "bundled")} pipelineData={pipelineData} />
    </>
  );
}
