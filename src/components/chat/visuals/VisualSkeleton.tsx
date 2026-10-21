"use client";

import React from "react";

const TYPE_LABELS: Record<string, string> = {
  chart: "Graph",
  diagram: "Diagram",
  figure: "Figure",
  image: "Picture",
};

export function VisualSkeleton({ type = "chart" }: { type?: string }) {
  const label = TYPE_LABELS[type.toLowerCase()] || "Visual";

  return (
    <div className="doubtster-visual-card doubtster-visual-skeleton" aria-busy="true" aria-live="polite">
      <div className="doubtster-visual-header">
        <div className="doubtster-visual-tag">
          <span className="doubtster-visual-handwritten-label">{label}</span>
          <span className="doubtster-skeleton-badge">Generating...</span>
        </div>
      </div>
      <div className="doubtster-visual-body">
        <div className="doubtster-skeleton-placeholder">
          <div className="doubtster-skeleton-shimmer" />
          <div className="doubtster-skeleton-content">
            <div className="doubtster-skeleton-icon" />
            <div className="doubtster-skeleton-line short" />
            <div className="doubtster-skeleton-line long" />
          </div>
        </div>
      </div>
    </div>
  );
}
