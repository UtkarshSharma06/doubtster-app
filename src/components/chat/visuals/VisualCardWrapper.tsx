"use client";

import React, { useState, useRef, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export interface VisualCardWrapperProps {
  title?: string;
  caption?: string;
  summary?: string;
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
  onResetView?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  children: React.ReactNode;
}

// Brand color palette
export const BRAND_COLORS = [
  "#2F7BFF", // blue
  "#E5484D", // red
  "#12A150", // green
  "#8A4DFF", // purple
  "#E08A00", // orange
];

/**
 * Helper to render text that may contain inline LaTeX ($...$)
 */
function MathLabel({ text }: { text: string }) {
  if (!text) return null;
  if (!text.includes("$") && !text.includes("\\")) {
    return <span>{text}</span>;
  }

  // Parse $...$ segments
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const rawMath = part.slice(1, -1);
          try {
            const html = katex.renderToString(rawMath, { throwOnError: false });
            return (
              <span
                key={i}
                dangerouslySetInnerHTML={{ __html: html }}
                style={{ margin: "0 2px" }}
              />
            );
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function VisualCardWrapper({
  title,
  caption,
  summary,
  tableData,
  onResetView,
  isExpanded,
  onToggleExpand,
  children,
}: VisualCardWrapperProps) {
  const [showTable, setShowTable] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Download visual as PNG
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const visualArea = cardRef.current.querySelector(".visual-canvas-area");
      if (!visualArea) return;

      const svgEl = visualArea.querySelector("svg");
      if (svgEl) {
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const bbox = svgEl.getBoundingClientRect();
          canvas.width = (bbox.width || 600) * 2;
          canvas.height = (bbox.height || 350) * 2;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const a = document.createElement("a");
          a.download = `${(title || "doubtster-visual").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
          a.href = canvas.toDataURL("image/png");
          a.click();
          URL.revokeObjectURL(blobURL);
        };
        img.src = blobURL;
      }
    } catch (err) {
      console.warn("Could not export visual:", err);
    }
  };

  // Copy visual as image to clipboard
  const handleCopy = async () => {
    if (!cardRef.current) return;
    try {
      const visualArea = cardRef.current.querySelector(".visual-canvas-area");
      if (!visualArea) return;

      const svgEl = visualArea.querySelector("svg");
      if (svgEl && navigator.clipboard && (window as any).ClipboardItem) {
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const bbox = svgEl.getBoundingClientRect();
          canvas.width = (bbox.width || 600) * 2;
          canvas.height = (bbox.height || 350) * 2;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(async (blob) => {
            if (blob) {
              await navigator.clipboard.write([
                new (window as any).ClipboardItem({ "image/png": blob }),
              ]);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
            URL.revokeObjectURL(blobURL);
          }, "image/png");
        };
        img.src = blobURL;
      }
    } catch (err) {
      console.warn("Could not copy visual to clipboard:", err);
    }
  };

  return (
    <div
      ref={cardRef}
      className="doubtster-visual-card"
      role="figure"
      aria-label={summary || title || "Interactive diagram"}
      style={{
        background: "#ffffff",
        border: "1px solid #DADADF",
        borderRadius: "14px",
        padding: "12px 14px",
        margin: "12px 0",
        boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.05)",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#0B0B0F",
        position: "relative",
      }}
    >
      {/* Title Header */}
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
            fontSize: "13.5px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: BRAND_COLORS[0],
                display: "inline-block",
              }}
            />
            <MathLabel text={title} />
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                title={isExpanded ? "Compact height" : "Expand height"}
                aria-label={isExpanded ? "Compact height" : "Expand height"}
                style={{
                  background: "transparent",
                  border: "1px solid #DADADF",
                  borderRadius: "6px",
                  padding: "2px 7px",
                  fontSize: "11.5px",
                  color: "#6E6E78",
                  cursor: "pointer",
                }}
              >
                {isExpanded ? "Compact" : "Expand"}
              </button>
            )}
            {onResetView && (
              <button
                type="button"
                onClick={onResetView}
                title="Reset pan and zoom"
                aria-label="Reset view"
                style={{
                  background: "transparent",
                  border: "1px solid #DADADF",
                  borderRadius: "6px",
                  padding: "2px 7px",
                  fontSize: "11.5px",
                  color: "#6E6E78",
                  cursor: "pointer",
                }}
              >
                Reset view
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div
        className="visual-canvas-area"
        style={{
          width: "100%",
          minHeight: "180px",
          position: "relative",
          overflow: "hidden",
          borderRadius: "10px",
        }}
      >
        {children}
      </div>

      {/* Optional Caption */}
      {caption && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            color: "#6E6E78",
            lineHeight: 1.4,
          }}
        >
          <MathLabel text={caption} />
        </div>
      )}

      {/* Action Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid #ECECEF",
          fontSize: "11.5px",
          color: "#6E6E78",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          {tableData && tableData.rows.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTable(!showTable)}
              aria-expanded={showTable}
              style={{
                background: showTable ? "#E6EEFF" : "transparent",
                color: showTable ? BRAND_COLORS[0] : "#6E6E78",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px",
                fontWeight: 500,
              }}
            >
              {showTable ? "Hide data table" : "Show data table"}
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy as image"
            style={{
              background: "transparent",
              border: "none",
              color: copied ? BRAND_COLORS[2] : "#6E6E78",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            {copied ? "Copied image!" : "Copy image"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            title="Download PNG"
            style={{
              background: "transparent",
              border: "none",
              color: "#6E6E78",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            Download PNG
          </button>
        </div>
      </div>

      {/* Accessibility Data Table */}
      {showTable && tableData && (
        <div
          style={{
            marginTop: "12px",
            overflowX: "auto",
            maxHeight: "180px",
            fontSize: "12px",
            borderTop: "1px solid #ECECEF",
            paddingTop: "8px",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F4F4F5" }}>
                {tableData.headers.map((h, i) => (
                  <th key={i} style={{ padding: "6px 10px", borderBottom: "1px solid #DADADF" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: "1px solid #F0F0F3" }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: "5px 10px" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
