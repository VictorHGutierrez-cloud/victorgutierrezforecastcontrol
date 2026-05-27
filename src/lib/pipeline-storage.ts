import type { PipelineData } from "@/lib/pipeline-types";

export const PIPELINE_UPLOAD_STORAGE_KEY = "forecast-row-pipeline-upload-v1";

export type StoredPipelineUpload = {
  pipeline: PipelineData;
  uploadedAt: string;
  fileName: string;
};

export function loadPipelineFromStorage(): StoredPipelineUpload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PIPELINE_UPLOAD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPipelineUpload;
    if (!parsed?.pipeline?.deals || !parsed.uploadedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePipelineToStorage(pipeline: PipelineData, fileName: string): void {
  const payload: StoredPipelineUpload = {
    pipeline,
    uploadedAt: new Date().toISOString(),
    fileName,
  };
  window.localStorage.setItem(PIPELINE_UPLOAD_STORAGE_KEY, JSON.stringify(payload));
}

export function clearPipelineUploadStorage(): void {
  window.localStorage.removeItem(PIPELINE_UPLOAD_STORAGE_KEY);
}
