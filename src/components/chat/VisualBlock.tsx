"use client";

import React from "react";
import dynamic from "next/dynamic";
import { VisualSpec } from "@/lib/visuals/schema";

import FunctionPlot from "./visuals/FunctionPlot";
import DataChart from "./visuals/DataChart";
import Diagram from "./visuals/Diagram";
import Molecule from "./visuals/Molecule";

function VisualSkeletonLoader({ title }: { title: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #DADADF",
        borderRadius: "16px",
        padding: "16px",
        margin: "18px 0",
        minHeight: "240px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#6E6E78",
        fontSize: "13px",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          border: "3px solid #E6EEFF",
          borderTopColor: "#2F7BFF",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          marginBottom: "12px",
        }}
      />
      <span>{title}</span>
    </div>
  );
}

export interface VisualBlockProps {
  visual: VisualSpec;
}

export function VisualBlock({ visual }: VisualBlockProps) {
  if (!visual || !visual.type) return null;

  switch (visual.type) {
    case "function_plot":
      return <FunctionPlot spec={visual} />;
    case "data_chart":
      return <DataChart spec={visual} />;
    case "diagram":
      return <Diagram spec={visual} />;
    case "molecule":
      return <Molecule spec={visual} />;
    default:
      return null;
  }
}

export default VisualBlock;
