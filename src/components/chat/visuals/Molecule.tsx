"use client";

import React, { useEffect, useRef, useState } from "react";
import SmilesDrawer from "smiles-drawer";
import { MoleculeSpec } from "@/lib/visuals/schema";
import { VisualCardWrapper } from "./VisualCardWrapper";

export interface MoleculeProps {
  spec: MoleculeSpec;
}

export default function Molecule({ spec }: MoleculeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    setError(null);

    try {
      const cleanSmiles = spec.smiles.trim();
      SmilesDrawer.parse(
        cleanSmiles,
        (tree: any) => {
          if (!svgRef.current) return;
          try {
            svgRef.current.innerHTML = "";
            const drawer = new SmilesDrawer.SvgDrawer({
              width: 320,
              height: 200,
              bondThickness: 1.8,
              fontSizeLarge: 12,
              fontSizeSmall: 8,
              padding: 20,
            });
            drawer.draw(tree, svgRef.current, "light");
          } catch (drawErr) {
            console.warn("[Molecule] Draw error:", drawErr);
            setError("Couldn't draw this molecule.");
          }
        },
        (parseErr: any) => {
          console.warn("[Molecule] Parse error for SMILES:", spec.smiles, parseErr);
          setError("Couldn't draw this molecule.");
        }
      );
    } catch (err) {
      console.warn("[Molecule] Exception:", err);
      setError("Couldn't draw this molecule.");
    }
  }, [spec.smiles]);

  const title = spec.name
    ? `${spec.name} (${spec.smiles})`
    : `Chemical Structure (${spec.smiles})`;

  return (
    <VisualCardWrapper
      title={title}
      summary={`Chemical molecule structure for ${spec.name || spec.smiles}`}
    >
      <div
        style={{
          width: "100%",
          minHeight: "240px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px",
        }}
      >
        {error ? (
          <div style={{ color: "#6E6E78", fontSize: "13px", fontStyle: "italic" }}>
            {error}
          </div>
        ) : (
          <svg
            ref={svgRef}
            style={{
              maxWidth: "100%",
              height: "240px",
              display: "block",
              margin: "0 auto",
            }}
          />
        )}
      </div>
    </VisualCardWrapper>
  );
}
