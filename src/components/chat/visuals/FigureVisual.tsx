"use client";

import React, { useState, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";

interface FigureLabel {
  text: string;
  x?: number;
  y?: number;
  pointer_to?: [number, number];
  from?: [number, number];
}

interface FigurePayload {
  title?: string;
  viewbox?: [number, number] | string;
  shapes?: string;
  labels?: FigureLabel[];
}

export function FigureVisual({ rawJson }: { rawJson: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const figure = useMemo<FigurePayload | null>(() => {
    try {
      let cleaned = rawJson.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\s*/i, "");
      if (cleaned.endsWith("```")) cleaned = cleaned.replace(/\s*```$/, "");
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn("Figure JSON parse error:", err);
      return null;
    }
  }, [rawJson]);

  const sanitizedSvg = useMemo(() => {
    if (!mounted || !figure?.shapes) return "";
    let clean = DOMPurify.sanitize(figure.shapes, {
      USE_PROFILES: { svg: true, svgFilters: false },
      ALLOWED_TAGS: ["g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon"],
      ALLOWED_ATTR: [
        "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2",
        "width", "height", "points", "d", "fill", "fill-opacity",
        "stroke", "stroke-width", "stroke-dasharray", "stroke-opacity",
        "transform", "opacity",
      ],
      FORBID_TAGS: ["script", "style", "a", "iframe", "object", "embed", "image", "foreignObject"],
      FORBID_ATTR: ["href", "xlink:href", "src"],
    });

    // Strip any url() expressions in styles or attributes
    clean = clean.replace(/url\([^)]*\)/gi, "none");
    return clean;
  }, [mounted, figure?.shapes]);

  if (!mounted) {
    return <div className="doubtster-figure-loading" style={{ height: 260 }} />;
  }

  if (!figure) {
    return (
      <div className="doubtster-figure-error">
        <pre><code>{rawJson}</code></pre>
      </div>
    );
  }

  let vbW = 400;
  let vbH = 300;
  if (Array.isArray(figure.viewbox) && figure.viewbox.length >= 2) {
    vbW = Number(figure.viewbox[0]) || 400;
    vbH = Number(figure.viewbox[1]) || 300;
  } else if (typeof figure.viewbox === "string") {
    const parts = figure.viewbox.split(/\s+/).map(Number);
    if (parts.length === 4) {
      vbW = parts[2];
      vbH = parts[3];
    } else if (parts.length === 2) {
      vbW = parts[0];
      vbH = parts[1];
    }
  }

  const labels = figure.labels || [];

  return (
    <div className="doubtster-figure-wrapper">
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="doubtster-figure-svg"
      >
        {/* Render sanitized SVG shapes */}
        <g
          className="doubtster-figure-shapes-layer"
          dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        />

        {/* Render label leader lines and tags */}
        <g className="doubtster-figure-labels-layer">
          {labels.map((lbl, idx) => {
            const target: [number, number] = lbl.pointer_to
              ? [lbl.pointer_to[0], lbl.pointer_to[1]]
              : [lbl.x ?? vbW / 2, lbl.y ?? vbH / 2];

            const from: [number, number] = lbl.from
              ? [lbl.from[0], lbl.from[1]]
              : [
                  target[0] + (target[0] > vbW / 2 ? 50 : -50),
                  target[1] - 40,
                ];

            const textLen = (lbl.text || "").length;
            const badgeW = Math.max(textLen * 7.5 + 16, 48);

            return (
              <g key={idx} className="doubtster-figure-annotation-group">
                {/* Dashed leader line */}
                <line
                  x1={from[0]}
                  y1={from[1]}
                  x2={target[0]}
                  y2={target[1]}
                  className="doubtster-figure-leader-line"
                />
                {/* Pointer dot */}
                <circle
                  cx={target[0]}
                  cy={target[1]}
                  r={4}
                  className="doubtster-figure-pointer-dot"
                />
                {/* Label text pill */}
                <g transform={`translate(${from[0]}, ${from[1]})`} className="doubtster-figure-label-badge">
                  <rect
                    x={-badgeW / 2}
                    y={-12}
                    width={badgeW}
                    height={22}
                    rx={5}
                    className="doubtster-figure-label-bg"
                  />
                  <text
                    x={0}
                    y={3}
                    textAnchor="middle"
                    className="doubtster-figure-label-text"
                  >
                    {lbl.text}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
