import ForecastDashboardShell from "@/components/forecast-dashboard-shell";
import type { PipelineData } from "@/lib/pipeline-types";
import pipelineData from "../../public/data/pipeline.json";

const data = pipelineData as PipelineData;

export default function HomePage() {
  const siteUrl =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "https://victorhgutierrez-cloud.github.io/victorgutierrezforecastcontrol/";

  return <ForecastDashboardShell pipelineData={data} siteUrl={siteUrl} />;
}
