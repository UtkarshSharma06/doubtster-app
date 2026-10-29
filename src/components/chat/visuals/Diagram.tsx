"use client";

import React, { useEffect, useState, useId } from "react";
import mermaid from "mermaid";
import DOMPurify from "dompurify";
import { DiagramSpec } from "@/lib/visuals/schema";
import { VisualCardWrapper } from "./VisualCardWrapper";
import {
  sanitizeMermaidCode,
  cleanupStrayMermaidElements,
  isMermaidErrorSvg,
} from "./mermaidUtils";

export interface DiagramProps {
  spec: DiagramSpec;
}

let mermaidInitialized = false;

function ensureMermaid() {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      flowchart: {
        htmlLabels: false,
        useMaxWidth: true,
      },
      theme: "base",
      themeVariables: {
        primaryColor: "#EEF4FF",
        primaryTextColor: "#0B0B0F",
        primaryBorderColor: "#2F7BFF",
        lineColor: "#2F7BFF",
        secondaryColor: "#F4F4F6",
        tertiaryColor: "#FFFFFF",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "14px",
      },
    });
    mermaidInitialized = true;
  }
}

export default function Diagram({ spec }: DiagramProps) {
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const rawId = useId();
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    let active = true;
    ensureMermaid();

    async function renderDiagram() {
      try {
        setError(null);
        // Clean and sanitize mermaid source
        const cleanMermaid = sanitizeMermaidCode(spec.mermaid);
        const { svg } = await mermaid.render(diagramId, cleanMermaid);

        // Remove any phantom error nodes Mermaid creates in document.body
        cleanupStrayMermaidElements(diagramId);

        if (isMermaidErrorSvg(svg)) {
          throw new Error("Mermaid returned syntax error");
        }

        if (active) {
          // Strictly sanitize SVG with DOMPurify
          const sanitized = DOMPurify.sanitize(svg, {
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ["foreignObject"],
          });
          setSvgHtml(sanitized);
        }
      } catch (err: any) {
        cleanupStrayMermaidElements(diagramId);
        if (active) {
          console.warn("[Diagram] Mermaid render error:", err);
          setError("Couldn't draw this diagram.");
        }
      }
    }

    renderDiagram();
    return () => {
      active = false;
    };
  }, [spec.mermaid, diagramId]);

  return (
    <VisualCardWrapper
      title={spec.title}
      summary={`Diagram: ${spec.title}`}
    >
      <div
        style={{
          width: "100%",
          minHeight: "160px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflowX: "auto",
          padding: "10px 0",
        }}
      >
        {error ? (
          <div style={{ color: "#6E6E78", fontSize: "13px", fontStyle: "italic" }}>
            {error}
          </div>
        ) : svgHtml ? (
          <div
            className="doubtster-mermaid-container"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
          />
        ) : (
          <div style={{ color: "#6E6E78", fontSize: "13px" }}>Rendering diagram...</div>
        )}
      </div>
    </VisualCardWrapper>
  );
}
