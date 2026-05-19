import ForecastDashboardShell from "@/components/forecast-dashboard-shell";
import type { PipelineData } from "@/lib/pipeline-types";
import pipelineData from "../../public/data/pipeline.json";

const data = pipelineData as PipelineData;

export default function HomePage() {
  return <ForecastDashboardShell pipelineData={data} />;
}
