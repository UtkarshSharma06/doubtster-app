"use client";

import React from "react";
import { Chart } from "@/lib/chat/schema";
import { TrajectoryChart } from "../charts/TrajectoryChart";

interface FigureBlockProps {
  id: string;
  title: string;
  caption: string;
  chart: Chart;
  stepNum?: number;
}

export function FigureBlock({ id, title, caption, chart, stepNum = 4 }: FigureBlockProps) {
  return (
    <section className="sec rv in" id={id || "s-graph"}>
      <div className="sh">
        <span className="n">{stepNum}</span>
        <h2>{title}</h2>
        <small>interactive visual</small>
      </div>

      {chart.kind === "trajectory" && (
        <TrajectoryChart
          v0={chart.v0}
          angleDeg={chart.angleDeg}
          g={chart.g}
          h0={chart.h0}
        />
      )}

      {caption && (
        <p className="tx" style={{ fontSize: "14px", color: "var(--mute)", marginTop: "8px" }}>
          {caption}
        </p>
      )}
    </section>
  );
}

