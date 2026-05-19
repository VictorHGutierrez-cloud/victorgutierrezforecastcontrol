"use client";
/* Area Chart — https://www.subframe.com/library/components/area-chart */

import React from "react";
import * as SubframeCore from "@subframe/core";

const SubframeUtils = {
  twClassNames: SubframeCore.createTwClassNames([
    "text-caption",
    "text-caption-bold",
    "text-body",
    "text-body-bold",
    "text-heading-3",
    "text-heading-2",
    "text-heading-1",
    "text-monospace-body",
  ]),
};

type DataPoint = Record<string, string | number>;

interface AreaChartRootProps
  extends Omit<
    React.ComponentProps<typeof SubframeCore.AreaChart>,
    "data" | "categories" | "index"
  > {
  data?: DataPoint[];
  categories?: string[];
  index?: string;
  stacked?: boolean;
  className?: string;
}

const AreaChartRoot = React.forwardRef<
  React.ElementRef<typeof SubframeCore.AreaChart>,
  AreaChartRootProps
>(function AreaChartRoot(
  {
    data = [],
    categories = [],
    index = "index",
    stacked = false,
    className,
    colors = ["#0d9488", "#12a594", "#2563eb", "#64748b"],
    dark = false,
    ...otherProps
  }: AreaChartRootProps,
  ref,
) {
  return (
    <SubframeCore.AreaChart
      className={SubframeUtils.twClassNames("h-80 w-full", className)}
      ref={ref}
      data={data}
      categories={categories}
      index={index}
      stacked={stacked}
      colors={colors}
      dark={dark}
      {...otherProps}
    />
  );
});

export const AreaChart = AreaChartRoot;
export default AreaChart;
