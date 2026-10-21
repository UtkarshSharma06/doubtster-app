"use client";

import React, { useState, useEffect, useRef } from "react";

export function DiagramVisual({ code }: { code: string }) {
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderDiagram() {
      try {
        setHasError(false);
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        const isDark = document.documentElement.classList.contains("dark");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDark ? "dark" : "default",
          fontFamily: "system-ui, -apple-system, sans-serif",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
          },
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        // Clean any code block fencing
        let cleanCode = code.trim();
        if (cleanCode.startsWith("```mermaid")) cleanCode = cleanCode.replace(/^```mermaid\s*/i, "");
        if (cleanCode.startsWith("```diagram")) cleanCode = cleanCode.replace(/^```diagram\s*/i, "");
        if (cleanCode.endsWith("```")) cleanCode = cleanCode.replace(/\s*```$/, "");

        const { svg } = await mermaid.render(id, cleanCode);
        if (!isCancelled) {
          setSvgHtml(svg);
        }
      } catch (err) {
        console.warn("Mermaid diagram rendering error, displaying collapsed source:", err);
        if (!isCancelled) {
          setHasError(true);
        }
      }
    }

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [code]);

  if (hasError) {
    return (
      <div className="doubtster-diagram-fallback-container">
        <details className="doubtster-diagram-source-details">
          <summary className="doubtster-diagram-source-summary">Show diagram source</summary>
          <pre className="doubtster-diagram-source-code">
            <code>{code}</code>
          </pre>
        </details>
      </div>
    );
  }

  if (!svgHtml) {
    return (
      <div className="doubtster-diagram-loading" aria-label="Loading diagram">
        <div className="doubtster-diagram-spinner" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`doubtster-diagram-viewport ${isZoomed ? "zoomed" : ""}`}
      onClick={() => setIsZoomed(!isZoomed)}
      title="Click to toggle zoom"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsZoomed(!isZoomed);
        }
      }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
