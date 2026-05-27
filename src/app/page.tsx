import ForecastDashboardClient from "@/components/forecast-dashboard-client";
import type { PipelineData } from "@/lib/pipeline-types";
import pipelineData from "../../public/data/pipeline.json";

const data = pipelineData as PipelineData;

export default function HomePage() {
  return <ForecastDashboardClient bundledData={data} />;
}
