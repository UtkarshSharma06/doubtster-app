"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Mafs, Coordinates, Plot, Point, Polygon, Text, Line } from "mafs";
import "mafs/core.css";
import { FunctionPlotSpec } from "@/lib/visuals/schema";
import {
  compileExpression,
  buildShadePolygon,
  autoCalculateYRange,
} from "@/lib/visuals/evaluate";
import { VisualCardWrapper, BRAND_COLORS } from "./VisualCardWrapper";

function getNiceStep(span: number): number {
  if (span <= 0 || !Number.isFinite(span)) return 1;
  const rawStep = span / 6;
  const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const fraction = rawStep / power;
  let niceFraction = 1;
  if (fraction >= 7) niceFraction = 10;
  else if (fraction >= 3.5) niceFraction = 5;
  else if (fraction >= 1.5) niceFraction = 2;
  else niceFraction = 1;
  return niceFraction * power;
}

export interface FunctionPlotProps {
  spec: FunctionPlotSpec;
}

export default function FunctionPlot({ spec }: FunctionPlotProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const plotHeight = isExpanded ? 340 : 220;

  // Safe compiling of functions
  const compiledFunctions = useMemo(() => {
    return spec.functions.map((fn, idx) => {
      try {
        const evaluator = compileExpression(fn.expr);
        return {
          fn,
          evaluator,
          color: fn.color || BRAND_COLORS[idx % BRAND_COLORS.length],
          error: null,
        };
      } catch (err: any) {
        return {
          fn,
          evaluator: () => NaN,
          color: fn.color || BRAND_COLORS[idx % BRAND_COLORS.length],
          error: err.message,
        };
      }
    });
  }, [spec.functions]);

  // Initial bounds with proportional breathing margins so axes and curves never get squashed or clipped
  const { initialXRange, initialYRange } = useMemo(() => {
    const [xMinRaw, xMaxRaw] = spec.x_range;
    const xSpanRaw = Math.max(Math.abs(xMaxRaw - xMinRaw), 0.001);

    // Proportional margin for X:
    // If x starts at 0 or positive, leave extra room on the left for the y-axis line and labels
    const leftXMargin = xMinRaw >= 0 ? xSpanRaw * 0.08 : xSpanRaw * 0.05;
    const rightXMargin = xSpanRaw * 0.05;
    const xAdj: [number, number] = [
      Number((xMinRaw - leftXMargin).toFixed(4)),
      Number((xMaxRaw + rightXMargin).toFixed(4)),
    ];

    let yMinRaw: number;
    let yMaxRaw: number;
    if (spec.y_range && spec.y_range.length === 2) {
      [yMinRaw, yMaxRaw] = spec.y_range;
    } else {
      const evaluators = compiledFunctions.map((c) => c.evaluator);
      [yMinRaw, yMaxRaw] = autoCalculateYRange(evaluators, spec.x_range, spec.points);
    }
    const ySpanRaw = Math.max(Math.abs(yMaxRaw - yMinRaw), 0.001);

    // Proportional margin for Y:
    // If y starts at 0 or positive, leave ~9% room at the bottom for the x-axis numbers and labels
    const bottomYMargin = yMinRaw >= 0 ? ySpanRaw * 0.09 : ySpanRaw * 0.06;
    const topYMargin = ySpanRaw * 0.06;
    const yAdj: [number, number] = [
      Number((yMinRaw - bottomYMargin).toFixed(4)),
      Number((yMaxRaw + topYMargin).toFixed(4)),
    ];

    return { initialXRange: xAdj, initialYRange: yAdj };
  }, [spec.x_range, spec.y_range, spec.points, compiledFunctions]);

  // View state for pan and zoom reset
  const [viewState, setViewState] = useState<{ x: [number, number]; y: [number, number] }>({
    x: initialXRange,
    y: initialYRange,
  });

  // Sync viewState when spec ranges change
  useEffect(() => {
    setViewState({ x: initialXRange, y: initialYRange });
  }, [initialXRange, initialYRange]);

  const handleResetView = useCallback(() => {
    setViewState({ x: initialXRange, y: initialYRange });
  }, [initialXRange, initialYRange]);

  const xSpan = Math.abs(viewState.x[1] - viewState.x[0]);
  const ySpan = Math.abs(viewState.y[1] - viewState.y[0]);
  const xLineStep = getNiceStep(xSpan);
  const yLineStep = getNiceStep(ySpan);

  // Build polygon for shaded area (if specified)
  const shadePolygon = useMemo(() => {
    if (!spec.shade) return null;
    const targetIdx = spec.shade.fn || 0;
    const targetFn = compiledFunctions[targetIdx];
    if (!targetFn || targetFn.error) return null;

    const points = buildShadePolygon(
      targetFn.evaluator,
      spec.shade.from,
      spec.shade.to,
      75
    );
    return {
      points,
      color: targetFn.color,
    };
  }, [spec.shade, compiledFunctions]);

  // Generate table data for accessibility
  const tableData = useMemo(() => {
    const headers = [spec.x_label || "x", ...compiledFunctions.map((f) => f.fn.label || f.fn.expr)];
    const rows: (string | number)[][] = [];

    // Sample 7 key x positions
    const [xMin, xMax] = spec.x_range;
    const step = (xMax - xMin) / 6;
    for (let i = 0; i <= 6; i++) {
      const x = Math.round((xMin + i * step) * 100) / 100;
      const row: (string | number)[] = [x];
      for (const cf of compiledFunctions) {
        const val = cf.evaluator(x);
        row.push(Number.isFinite(val) ? Math.round(val * 100) / 100 : "—");
      }
      rows.push(row);
    }

    if (spec.points && spec.points.length > 0) {
      for (const pt of spec.points) {
        rows.push([
          `Point: (${pt.x}, ${pt.y})`,
          ...compiledFunctions.map(() => pt.label || "Marked point"),
        ]);
      }
    }

    return { headers, rows };
  }, [spec, compiledFunctions]);

  // One-sentence summary for screen readers
  const summary = useMemo(() => {
    const fnList = spec.functions.map((f) => f.label || f.expr).join(", ");
    let text = `Graph of ${fnList} on range x=[${spec.x_range[0]}, ${spec.x_range[1]}].`;
    if (spec.points && spec.points.length > 0) {
      const ptList = spec.points.map((p) => p.label || `(${p.x}, ${p.y})`).join(", ");
      text += ` Marked points: ${ptList}.`;
    }
    return text;
  }, [spec]);

  return (
    <VisualCardWrapper
      title={spec.title || (spec.functions[0] ? `y = ${spec.functions[0].expr}` : "Function Plot")}
      summary={summary}
      tableData={tableData}
      onResetView={handleResetView}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
    >
      <div
        className="doubtster-mafs-wrapper"
        style={{
          width: "100%",
          height: `${plotHeight}px`,
          position: "relative",
          backgroundColor: "var(--mafs-bg, #FFFFFF)",
          borderRadius: "8px",
        }}
      >
        <Mafs
          height={plotHeight}
          viewBox={{ x: viewState.x, y: viewState.y, padding: 0 }}
          preserveAspectRatio={false}
          pan={true}
        >
          <Coordinates.Cartesian
            subdivisions={false}
            xAxis={{
              lines: xLineStep,
              labels: (x) => {
                const rounded = Number(Math.round(Number(x + "e+6")) + "e-6");
                return rounded.toString();
              },
            }}
            yAxis={{
              lines: yLineStep,
              labels: (y) => {
                const rounded = Number(Math.round(Number(y + "e+6")) + "e-6");
                return rounded.toString();
              },
            }}
          />

          {/* Shaded Area */}
          {shadePolygon && shadePolygon.points.length > 0 && (
            <Polygon
              points={shadePolygon.points}
              color={shadePolygon.color}
              fillOpacity={0.25}
              weight={0}
            />
          )}

          {/* Function Curves */}
          {compiledFunctions.map((cf, idx) => {
            if (cf.error) return null;
            return (
              <Plot.OfX
                key={idx}
                y={cf.evaluator}
                color={cf.color}
                weight={2.5}
              />
            );
          })}

          {/* Vertical Lines (e.g. Asymptotes) */}
          {spec.vertical_lines?.map((vl, idx) => (
            <React.Fragment key={idx}>
              <Line.PointAngle
                point={[vl.x, 0]}
                angle={Math.PI / 2}
                style="dashed"
                color="#6E6E78"
                weight={1.5}
              />
              {vl.label && (
                <Text x={vl.x} y={viewState.y[1] * 0.85} attach="w" size={12}>
                  {vl.label}
                </Text>
              )}
            </React.Fragment>
          ))}

          {/* Marked Points */}
          {spec.points?.map((pt, idx) => (
            <React.Fragment key={idx}>
              <Point x={pt.x} y={pt.y} color={BRAND_COLORS[0]} />
              {pt.label && (
                <Text
                  x={pt.x}
                  y={pt.y}
                  attach="n"
                  size={13}
                  color="#0B0B0F"
                >
                  {pt.label}
                </Text>
              )}
            </React.Fragment>
          ))}
        </Mafs>
      </div>
    </VisualCardWrapper>
  );
}
