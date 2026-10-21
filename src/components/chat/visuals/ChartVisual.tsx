"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as math from "mathjs";
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
  ReferenceDot,
  ReferenceLine,
} from "recharts";

interface HighlightPoint {
  x: number;
  y: number;
  label?: string;
}

interface ChartSeries {
  label: string;
  data: { x: number; y: number }[];
}

interface ChartFunction {
  expr: string;
  label?: string;
  from?: number;
  to?: number;
}

interface ChartPayload {
  type?: "line" | "bar" | "pie" | "scatter" | "function";
  title?: string;
  x_label?: string;
  y_label?: string;
  series?: ChartSeries[];
  functions?: ChartFunction[];
  highlight?: HighlightPoint[];
  [key: string]: any;
}

const PALETTE = ["#3b82f6", "#10b981", "#ec4899", "#f59e0b", "#8b5cf6"];

/**
 * Custom sticky-note style label for highlighted points
 */
function StickyHighlightDot(props: any) {
  const { cx, cy, label, fill } = props;
  if (typeof cx !== "number" || typeof cy !== "number") return null;

  const text = label || "";
  // estimate width
  const boxWidth = Math.max(text.length * 7.5 + 16, 60);

  return (
    <g className="doubtster-chart-highlight-group">
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill={fill || "#ec4899"}
        stroke="#ffffff"
        strokeWidth={2.5}
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
      />
      {text && (
        <g transform={`translate(${cx}, ${cy - 12})`}>
          <rect
            x={-boxWidth / 2}
            y={-28}
            width={boxWidth}
            height={24}
            rx={5}
            fill="#fef08a"
            stroke="#ca8a04"
            strokeWidth={1}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
          />
          <polygon
            points={`0, -4 -4, -8 4, -8`}
            fill="#fef08a"
          />
          <text
            x={0}
            y={-12}
            textAnchor="middle"
            fill="#854d0e"
            fontSize="12"
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {text}
          </text>
        </g>
      )}
    </g>
  );
}

export function ChartVisual({ rawJson }: { rawJson: string }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Safe parse & evaluate
  const parsed = useMemo<{ data: ChartPayload | null; error: boolean; errorData?: any[] }>(() => {
    try {
      // Clean up markdown / JSON artifacts if any
      let cleaned = rawJson.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\s*/i, "");
      if (cleaned.endsWith("```")) cleaned = cleaned.replace(/\s*```$/, "");
      
      const obj: ChartPayload = JSON.parse(cleaned);

      // Handle function type
      if (obj.type === "function" || (obj.functions && obj.functions.length > 0)) {
        const generatedSeries: ChartSeries[] = [];
        const fns = obj.functions || [];

        for (const fn of fns) {
          if (!fn.expr) continue;
          const from = typeof fn.from === "number" ? fn.from : 0;
          const to = typeof fn.to === "number" ? fn.to : 10;
          const min = Math.min(from, to);
          const max = Math.max(from, to);
          const steps = 200;
          const stepSize = (max - min) / steps;

          const compiled = math.compile(fn.expr);
          const points: { x: number; y: number }[] = [];

          for (let i = 0; i <= steps; i++) {
            const xVal = min + i * stepSize;
            try {
              const res = Number(compiled.evaluate({ x: xVal, X: xVal, t: xVal }));
              if (typeof res === "number" && !isNaN(res) && isFinite(res)) {
                points.push({
                  x: Number(xVal.toFixed(2)),
                  y: Number(res.toFixed(2)),
                });
              }
            } catch (evalErr) {
              // ignore out-of-domain sample points
            }
          }

          generatedSeries.push({
            label: fn.label || fn.expr,
            data: points,
          });
        }

        obj.series = generatedSeries;
        obj.type = "line";
      }

      return { data: obj, error: false };
    } catch (err) {
      console.warn("Chart JSON parse error, falling back to table view:", err);
      // Attempt to extract any tabular numbers
      const extractedRows: any[] = [];
      const numMatches = [...rawJson.matchAll(/"x":\s*([0-9.-]+),\s*"y":\s*([0-9.-]+)/g)];
      for (const m of numMatches) {
        extractedRows.push({ x: Number(m[1]), y: Number(m[2]) });
      }
      return { data: null, error: true, errorData: extractedRows };
    }
  }, [rawJson]);

  if (!mounted) {
    return <div className="doubtster-chart-loading" style={{ height: 320 }} />;
  }

  // Fallback to table on error
  if (parsed.error || !parsed.data) {
    const rows = parsed.errorData || [];
    return (
      <div className="doubtster-chart-fallback-table-wrapper">
        <div className="doubtster-chart-fallback-notice">
          Data values summary:
        </div>
        {rows.length > 0 ? (
          <table className="doubtster-chart-fallback-table">
            <thead>
              <tr>
                <th>X</th>
                <th>Y</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.x}</td>
                  <td>{r.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="doubtster-chart-fallback-raw">
            <pre><code>{rawJson}</code></pre>
          </div>
        )}
      </div>
    );
  }

  const chart = parsed.data;
  const chartType = chart.type || "line";
  const series = chart.series || [];
  const highlights = chart.highlight || [];

  const textColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";

  // If Pie chart
  if (chartType === "pie") {
    const pieData = (series[0]?.data || []).map((d, i) => ({
      name: `Item ${d.x}`,
      value: d.y,
    }));

    return (
      <div className="doubtster-chart-container" style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              isAnimationActive={true}
              animationDuration={800}
              label
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: textColor }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Combine multiple series data into unified domain if needed, or use first series
  const primaryData = series[0]?.data || [];

  return (
    <div className="doubtster-chart-container" style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height={320}>
        {chartType === "bar" ? (
          <BarChart data={primaryData} margin={{ top: 35, right: 25, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="x"
              stroke={textColor}
              tick={{ fontSize: 12 }}
              label={chart.x_label ? { value: chart.x_label, position: "insideBottom", offset: -15, fill: textColor, fontSize: 12 } : undefined}
            />
            <YAxis
              stroke={textColor}
              tick={{ fontSize: 12 }}
              label={chart.y_label ? { value: chart.y_label, angle: -90, position: "insideLeft", fill: textColor, fontSize: 12 } : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            {series.map((s, idx) => (
              <Bar
                key={s.label || idx}
                dataKey="y"
                name={s.label || "Value"}
                fill={PALETTE[idx % PALETTE.length]}
                radius={[4, 4, 0, 0]}
                isAnimationActive={true}
                animationDuration={800}
              />
            ))}
            {highlights.map((h, i) => (
              <React.Fragment key={i}>
                <ReferenceLine x={h.x} stroke="#ec4899" strokeDasharray="3 3" strokeWidth={1.5} />
                <ReferenceLine y={h.y} stroke="#ec4899" strokeDasharray="3 3" strokeWidth={1.5} />
                <ReferenceDot
                  x={h.x}
                  y={h.y}
                  shape={<StickyHighlightDot label={h.label} fill="#ec4899" />}
                />
              </React.Fragment>
            ))}
          </BarChart>
        ) : chartType === "scatter" ? (
          <ScatterChart margin={{ top: 35, right: 25, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              type="number"
              dataKey="x"
              stroke={textColor}
              tick={{ fontSize: 12 }}
              label={chart.x_label ? { value: chart.x_label, position: "insideBottom", offset: -15, fill: textColor, fontSize: 12 } : undefined}
            />
            <YAxis
              type="number"
              dataKey="y"
              stroke={textColor}
              tick={{ fontSize: 12 }}
              label={chart.y_label ? { value: chart.y_label, angle: -90, position: "insideLeft", fill: textColor, fontSize: 12 } : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            {series.map((s, idx) => (
              <Scatter
                key={s.label || idx}
                name={s.label || "Scatter"}
                data={s.data}
                fill={PALETTE[idx % PALETTE.length]}
                isAnimationActive={true}
                animationDuration={800}
              />
            ))}
            {highlights.map((h, i) => (
              <React.Fragment key={i}>
                <ReferenceLine x={h.x} stroke="#ec4899" strokeDasharray="3 3" strokeWidth={1.5} />
                <ReferenceLine y={h.y} stroke="#ec4899" strokeDasharray="3 3" strokeWidth={1.5} />
                <ReferenceDot
                  x={h.x}
                  y={h.y}
                  shape={<StickyHighlightDot label={h.label} fill="#ec4899" />}
                />
              </React.Fragment>
            ))}
          </ScatterChart>
        ) : (
          /* Default Line / Function chart */
          <LineChart data={primaryData} margin={{ top: 40, right: 30, left: 15, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="x"
              type="number"
              domain={["auto", "auto"]}
              stroke={textColor}
              tick={{ fontSize: 12 }}
              label={chart.x_label ? { value: chart.x_label, position: "insideBottom", offset: -15, fill: textColor, fontSize: 12 } : undefined}
            />
            <YAxis
              stroke={textColor}
              tick={{ fontSize: 12 }}
              domain={["auto", "auto"]}
              label={chart.y_label ? { value: chart.y_label, angle: -90, position: "insideLeft", fill: textColor, fontSize: 12 } : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(val: any) => [val, series[0]?.label || "Value"]}
              labelFormatter={(lbl: any) => `${chart.x_label || "x"}: ${lbl}`}
            />
            {series.map((s, idx) => (
              <Line
                key={s.label || idx}
                type="monotone"
                dataKey="y"
                data={s.data}
                name={s.label || "Value"}
                stroke={PALETTE[idx % PALETTE.length]}
                strokeWidth={2.5}
                dot={s.data.length < 25 ? { r: 3 } : false}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationDuration={800}
              />
            ))}
            {highlights.map((h, i) => (
              <React.Fragment key={i}>
                <ReferenceLine x={h.x} stroke="#ec4899" strokeDasharray="4 4" strokeWidth={1.5} />
                <ReferenceLine y={h.y} stroke="#ec4899" strokeDasharray="4 4" strokeWidth={1.5} />
                <ReferenceDot
                  x={h.x}
                  y={h.y}
                  shape={<StickyHighlightDot label={h.label} fill="#ec4899" />}
                />
              </React.Fragment>
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
