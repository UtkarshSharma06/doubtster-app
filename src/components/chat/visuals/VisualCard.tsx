"use client";

import React, { useState, useRef, Suspense, lazy } from "react";
import { exportVisualToPng } from "./exportUtils";
import { VisualSkeleton } from "./VisualSkeleton";

// Lazy-load visual components
const ChartVisual = lazy(() =>
  import("./ChartVisual").then((m) => ({ default: m.ChartVisual }))
);
const DiagramVisual = lazy(() =>
  import("./DiagramVisual").then((m) => ({ default: m.DiagramVisual }))
);
const FigureVisual = lazy(() =>
  import("./FigureVisual").then((m) => ({ default: m.FigureVisual }))
);
const ImageVisual = lazy(() =>
  import("./ImageVisual").then((m) => ({ default: m.ImageVisual }))
);

const TYPE_CONFIG: Record<
  string,
  { label: string; iconType: string }
> = {
  chart: { label: "Graph", iconType: "chart" },
  diagram: { label: "Diagram", iconType: "diagram" },
  figure: { label: "Figure", iconType: "figure" },
  image: { label: "Picture", iconType: "image" },
};

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="16" height="16">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="16" height="16">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="20" height="20">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function VisualCard({
  type,
  rawContent,
}: {
  type: "chart" | "diagram" | "figure" | "image";
  rawContent: string;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageFound, setImageFound] = useState<boolean | null>(null);
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const config = TYPE_CONFIG[type] || { label: "Visual", iconType: "visual" };

  // If image type returned not found from API, hide card completely
  if (type === "image" && imageFound === false) {
    return null;
  }

  // Extract title if available from JSON
  let title = "";
  try {
    const parsed = JSON.parse(rawContent);
    title = parsed.title || parsed.caption || "";
  } catch (e) {
    // ignore
  }

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!contentRef.current || exporting) return;
    setExporting(true);
    const filename = `doubtster-${type}-${Date.now()}.png`;
    await exportVisualToPng(contentRef.current, filename);
    setExporting(false);
  };

  return (
    <>
      <div
        className="doubtster-visual-card"
        role="figure"
        aria-label={title || `${config.label} visual`}
      >
        <div className="doubtster-visual-header">
          <div className="doubtster-visual-tag">
            <span className="doubtster-visual-handwritten-label">{config.label}</span>
            {title && <span className="doubtster-visual-title-badge">{title}</span>}
          </div>

          <div className="doubtster-visual-actions">
            <button
              type="button"
              className="doubtster-visual-btn"
              onClick={handleExport}
              title="Save as image (PNG)"
              aria-label="Save as image"
              disabled={exporting}
            >
              <DownloadIcon />
              <span className="doubtster-visual-btn-label">
                {exporting ? "Saving..." : "Save as image"}
              </span>
            </button>

            <button
              type="button"
              className="doubtster-visual-btn"
              onClick={() => setIsFullscreen(true)}
              title="Open full screen"
              aria-label="Open full screen"
            >
              <MaximizeIcon />
              <span className="doubtster-visual-btn-label">Full screen</span>
            </button>
          </div>
        </div>

        <div className="doubtster-visual-body" ref={contentRef}>
          <Suspense fallback={<VisualSkeleton type={type} />}>
            {type === "chart" && <ChartVisual rawJson={rawContent} />}
            {type === "diagram" && <DiagramVisual code={rawContent} />}
            {type === "figure" && <FigureVisual rawJson={rawContent} />}
            {type === "image" && (
              <ImageVisual
                rawJson={rawContent}
                onImageStatus={(found) => setImageFound(found)}
              />
            )}
          </Suspense>
        </div>
      </div>

      {/* Full screen modal */}
      {isFullscreen && (
        <div
          className="doubtster-fullscreen-modal-backdrop"
          onClick={() => setIsFullscreen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${config.label} full screen view`}
        >
          <div
            className="doubtster-fullscreen-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="doubtster-fullscreen-modal-header">
              <span className="doubtster-visual-handwritten-label">{config.label}</span>
              {title && <span className="doubtster-fullscreen-title">{title}</span>}
              <button
                type="button"
                className="doubtster-fullscreen-close-btn"
                onClick={() => setIsFullscreen(false)}
                aria-label="Close full screen"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="doubtster-fullscreen-modal-body">
              <Suspense fallback={<VisualSkeleton type={type} />}>
                {type === "chart" && <ChartVisual rawJson={rawContent} />}
                {type === "diagram" && <DiagramVisual code={rawContent} />}
                {type === "figure" && <FigureVisual rawJson={rawContent} />}
                {type === "image" && <ImageVisual rawJson={rawContent} />}
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
