"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { DataChartSpec } from "@/lib/visuals/schema";
import { VisualCardWrapper, BRAND_COLORS } from "./VisualCardWrapper";

export interface DataChartProps {
  spec: DataChartSpec;
}

export default function DataChart({ spec }: DataChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const chartHeight = isExpanded ? 340 : 220;
  // Format data for Recharts
  // For Line and Bar charts, we consolidate series into common x-ticks
  const { chartData, seriesKeys } = useMemo(() => {
    if (spec.chart === "pie") {
      // For pie charts, first series data is slices
      const firstSeries = spec.series[0] || { data: [] };
      const pieData = firstSeries.data.map((item, idx) => ({
        name: String(item.x),
        value: Number(item.y),
        color: BRAND_COLORS[idx % BRAND_COLORS.length],
      }));
      return { chartData: pieData, seriesKeys: [] };
    }

    if (spec.chart === "scatter") {
      // Scatter can plot each series independently
      return { chartData: spec.series, seriesKeys: spec.series.map((s) => s.name) };
    }

    // Line and Bar: index by x
    const xMap = new Map<string | number, Record<string, any>>();
    const sKeys: string[] = [];

    spec.series.forEach((s) => {
      sKeys.push(s.name);
      s.data.forEach((pt) => {
        const existing = xMap.get(pt.x) || { x: pt.x };
        existing[s.name] = pt.y;
        xMap.set(pt.x, existing);
      });
    });

    const data = Array.from(xMap.values());
    return { chartData: data, seriesKeys: sKeys };
  }, [spec]);

  // Table data for accessibility
  const tableData = useMemo(() => {
    if (spec.chart === "pie") {
      const headers = ["Category", "Value"];
      const rows = (spec.series[0]?.data || []).map((d) => [String(d.x), d.y]);
      return { headers, rows };
    }

    const headers = [spec.x_label || "x", ...spec.series.map((s) => s.name)];
    const rows = (chartData as any[]).map((row) => {
      return [
        row.x,
        ...spec.series.map((s) => (row[s.name] !== undefined ? row[s.name] : "—")),
      ];
    });
    return { headers, rows };
  }, [spec, chartData]);

  // Accessibility summary
  const summary = useMemo(() => {
    return `${spec.chart.toUpperCase()} chart titled "${spec.title}" comparing ${spec.series
      .map((s) => s.name)
      .join(", ")}.`;
  }, [spec]);

  return (
    <VisualCardWrapper
      title={spec.title}
      summary={summary}
      tableData={tableData}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
    >
      <div style={{ width: "100%", height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {spec.chart === "line" ? (
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#6E6E78" strokeOpacity={0.15} />
              <XAxis
                dataKey="x"
                stroke="#6E6E78"
                fontSize={12}
                label={spec.x_label ? { value: spec.x_label, position: "insideBottom", offset: -8 } : undefined}
              />
              <YAxis
                stroke="#6E6E78"
                fontSize={12}
                label={spec.y_label ? { value: spec.y_label, angle: -90, position: "insideLeft" } : undefined}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #DADADF",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px" }} />
              {seriesKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={BRAND_COLORS[idx % BRAND_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          ) : spec.chart === "bar" ? (
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#6E6E78" strokeOpacity={0.15} />
              <XAxis
                dataKey="x"
                stroke="#6E6E78"
                fontSize={12}
                label={spec.x_label ? { value: spec.x_label, position: "insideBottom", offset: -8 } : undefined}
              />
              <YAxis
                stroke="#6E6E78"
                fontSize={12}
                label={spec.y_label ? { value: spec.y_label, angle: -90, position: "insideLeft" } : undefined}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #DADADF",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px" }} />
              {seriesKeys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={key}
                  fill={BRAND_COLORS[idx % BRAND_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : spec.chart === "scatter" ? (
            <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#6E6E78" strokeOpacity={0.15} />
              <XAxis
                type="number"
                dataKey="x"
                name={spec.x_label || "x"}
                stroke="#6E6E78"
                fontSize={12}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={spec.y_label || "y"}
                stroke="#6E6E78"
                fontSize={12}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #DADADF",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px" }} />
              {spec.series.map((s, idx) => (
                <Scatter
                  key={s.name}
                  name={s.name}
                  data={s.data}
                  fill={BRAND_COLORS[idx % BRAND_COLORS.length]}
                />
              ))}
            </ScatterChart>
          ) : (
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #DADADF",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {(chartData as any[]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </VisualCardWrapper>
  );
}
