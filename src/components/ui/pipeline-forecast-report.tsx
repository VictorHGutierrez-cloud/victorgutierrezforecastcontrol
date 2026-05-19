"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  StackedNormalizedAreaChart,
  LinearXAxis,
  LinearXAxisTickSeries,
  LinearXAxisTickLabel,
  LinearYAxis,
  LinearYAxisTickSeries,
  StackedNormalizedAreaSeries,
  Line,
  Area,
  Gradient,
  GradientStop,
  GridlineSeries,
  Gridline,
  ChartDataTypes,
} from "reaviz";
import { Target, Handshake, Globe2 } from "lucide-react";
import type { PipelineData } from "@/lib/pipeline-types";
import { formatCompact, formatCurrency } from "@/lib/utils";

const LEGEND_ITEMS = [
  { name: "Upside", color: "#C7D2FE" },
  { name: "Pipeline", color: "#6366F1" },
  { name: "Closed Won", color: "#34D399" },
  { name: "Not Forecasted", color: "#94A3B8" },
];

const CHART_COLOR_SCHEME = ["#C7D2FE", "#6366F1", "#34D399", "#94A3B8"];

const SummaryUpArrowIcon: React.FC<{ strokeColor: string }> = ({ strokeColor }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
    <path
      d="M5.50134 9.11119L10.0013 4.66675M10.0013 4.66675L14.5013 9.11119M10.0013 4.66675L10.0013 16.3334"
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="square"
    />
  </svg>
);

const DetailedTrendUpIcon: React.FC<{
  baseColor: string;
  strokeColor: string;
  className?: string;
}> = ({ baseColor, strokeColor, className }) => (
  <svg
    className={className}
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="14" fill={baseColor} fillOpacity="0.4" />
    <path
      d="M9.50134 12.6111L14.0013 8.16663M14.0013 8.16663L18.5013 12.6111M14.0013 8.16663L14.0013 19.8333"
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="square"
    />
  </svg>
);

function validateChartData(data: PipelineData["chartSeries"]): ChartDataTypes[] {
  return data.map((series) => ({
    ...series,
    data: series.data.map((item) => ({
      ...item,
      key: new Date(item.key),
      data: typeof item.data === "number" && !Number.isNaN(item.data) ? item.data : 0,
    })),
  })) as unknown as ChartDataTypes[];
}

interface PipelineForecastReportProps {
  data: PipelineData;
}

export default function PipelineForecastReport({ data }: PipelineForecastReportProps) {
  const { summary, chartMonths } = data;
  const [periodIndex, setPeriodIndex] = useState(0);

  const periodOptions = useMemo(
    () =>
      chartMonths.length > 0
        ? [
            { value: "all", label: "All close months" },
            ...chartMonths.map((m) => ({ value: m, label: m })),
          ]
        : [{ value: "all", label: "All close months" }],
    [chartMonths],
  );

  const selectedPeriod = periodOptions[periodIndex]?.value ?? "all";

  const filteredChart = useMemo(() => {
    if (selectedPeriod === "all") return data.chartSeries;
    return data.chartSeries.map((s) => ({
      ...s,
      data: s.data.filter((p) => p.key.startsWith(selectedPeriod)),
    }));
  }, [data.chartSeries, selectedPeriod]);

  const validatedChartData = useMemo(
    () => validateChartData(filteredChart),
    [filteredChart],
  );

  const upsideShare = Math.round((summary.upsideValue / summary.totalPipeline) * 100);

  const summaryStats = [
    {
      id: "upside",
      title: "Upside Forecast",
      count: summary.upsideValue,
      comparisonText: `${summary.upsideCount} deals · ${upsideShare}% of total pipe`,
      percentage: upsideShare,
      TrendIconSvg: SummaryUpArrowIcon,
      trendColor: "text-indigo-300",
      trendBgColor: "bg-indigo-500/30",
    },
    {
      id: "total",
      title: "Total Pipeline",
      count: summary.totalPipeline,
      comparisonText: `${summary.totalDeals} active deals across ${summary.countries.length} countries`,
      percentage: 100,
      TrendIconSvg: SummaryUpArrowIcon,
      trendColor: "text-emerald-300",
      trendBgColor: "bg-emerald-500/30",
    },
  ];

  const detailedMetrics = [
    {
      id: "avg",
      Icon: Target,
      label: "Avg. deal size",
      value: formatCurrency(summary.avgDealSize),
      trendBaseColor: "#6366F1",
      trendStrokeColor: "#A5B4FC",
      delay: 0,
    },
    {
      id: "activities",
      Icon: Handshake,
      label: "Sales activities",
      value: String(summary.totalActivities),
      trendBaseColor: "#6366F1",
      trendStrokeColor: "#A5B4FC",
      delay: 0.05,
    },
    {
      id: "markets",
      Icon: Globe2,
      label: "Active markets",
      value: String(summary.countries.length),
      trendBaseColor: "#059669",
      trendStrokeColor: "#6EE7B7",
      delay: 0.1,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col justify-between pt-4 pb-4 bg-white dark:bg-[#0c1222] rounded-3xl shadow-[11px_21px_3px_rgba(0,0,0,0.06),14px_27px_7px_rgba(0,0,0,0.10),19px_38px_14px_rgba(0,0,0,0.13),27px_54px_27px_rgba(0,0,0,0.16)] w-full max-w-2xl min-h-[714px] overflow-hidden border border-slate-200/60 dark:border-slate-800"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-start gap-4 p-7 pt-6 pb-4"
      >
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold mb-1">
            {data.meta.team} · Forecast Control
          </p>
          <h3 className="text-3xl text-left font-bold text-gray-900 dark:text-white">
            Pipeline Report
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Close-date mix by forecast category
          </p>
        </div>
        <select
          value={periodIndex}
          onChange={(e) => setPeriodIndex(Number(e.target.value))}
          className="bg-gray-100 dark:bg-[#1e293b] text-gray-800 dark:text-white p-3 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm shrink-0"
          aria-label="Select close month filter"
        >
          {periodOptions.map((option, i) => (
            <option key={option.value} value={i}>
              {option.label}
            </option>
          ))}
        </select>
      </motion.div>

      <div className="flex flex-wrap gap-6 w-full pl-8 pr-8 mb-4">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.name} className="flex gap-2 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex gap-2 items-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-500 dark:text-gray-400 text-xs">{item.name}</span>
            </motion.div>
          </div>
        ))}
      </div>

      <div className="reaviz-chart-container h-[280px] px-2">
        <StackedNormalizedAreaChart
          height={280}
          id="pipeline-stacked-normalized"
          data={validatedChartData as never}
          xAxis={
            <LinearXAxis
              type="time"
              tickSeries={
                <LinearXAxisTickSeries
                  label={
                    <LinearXAxisTickLabel
                      format={(v) =>
                        new Date(v).toLocaleDateString("en-US", {
                          month: "short",
                          year: "2-digit",
                        })
                      }
                      fill="var(--reaviz-tick-fill)"
                    />
                  }
                  tickSize={10}
                />
              }
            />
          }
          yAxis={
            <LinearYAxis
              axisLine={null}
              tickSeries={<LinearYAxisTickSeries line={null} label={null} tickSize={10} />}
            />
          }
          series={
            <StackedNormalizedAreaSeries
              line={<Line strokeWidth={3} glow={{ blur: 10 }} />}
              area={
                <Area
                  glow={{ blur: 20 }}
                  gradient={
                    <Gradient
                      stops={[
                        <GradientStop key={1} stopOpacity={0} />,
                        <GradientStop key={2} offset="80%" stopOpacity={0.2} />,
                      ]}
                    />
                  }
                />
              }
              colorScheme={CHART_COLOR_SCHEME}
            />
          }
          gridlines={
            <GridlineSeries line={<Gridline strokeColor="var(--reaviz-gridline-stroke)" />} />
          }
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row w-full pl-8 pr-8 justify-between pb-2 pt-8 gap-4 sm:gap-8"
      >
        {summaryStats.map((stat) => (
          <div key={stat.id} className="flex flex-col gap-2 w-full sm:w-1/2">
            <span className="text-xl text-gray-800 dark:text-gray-200">{stat.title}</span>
            <div className="flex items-center gap-2">
              <CountUp
                className="font-mono text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white"
                start={0}
                end={stat.count}
                duration={2}
                formattingFn={(v) => formatCompact(v)}
              />
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`flex ${stat.trendBgColor} p-1 pl-2 pr-2 items-center rounded-full ${stat.trendColor} text-sm font-medium`}
              >
                <stat.TrendIconSvg strokeColor={stat.id === "upside" ? "#A5B4FC" : "#6EE7B7"} />
                {stat.percentage}%
              </motion.div>
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{stat.comparisonText}</span>
          </div>
        ))}
      </motion.div>

      <div className="flex flex-col pl-8 pr-8 font-mono divide-y divide-gray-200 dark:divide-slate-800 mt-4">
        {detailedMetrics.map((metric) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: metric.delay }}
            className="flex w-full py-4 items-center gap-2"
          >
            <div className="flex flex-row gap-2 items-center text-base w-1/2 text-gray-500 dark:text-gray-400">
              <metric.Icon className="w-5 h-5 text-indigo-500" />
              <span className="truncate">{metric.label}</span>
            </div>
            <div className="flex gap-2 w-1/2 justify-end items-center">
              <span className="font-semibold text-xl text-gray-900 dark:text-white">
                {metric.value}
              </span>
              <DetailedTrendUpIcon
                baseColor={metric.trendBaseColor}
                strokeColor={metric.trendStrokeColor}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
