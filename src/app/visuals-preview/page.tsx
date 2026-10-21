"use client";

import React, { useState } from "react";
import { AnswerRenderer } from "@/components/chat/AnswerRenderer";
import { MessagePart } from "@/lib/visuals/schema";
import "@/styles/app.css";
import "@/styles/answer.css";

interface TestCase {
  id: string;
  query: string;
  title: string;
  category: string;
  parts: MessagePart[];
}

const TEST_CASES: TestCase[] = [
  {
    id: "roots",
    query: "Graph y = x^2 - 4 and show its roots",
    title: "1. Parabola with Roots (y = x^2 - 4)",
    category: "Mathematics",
    parts: [
      {
        type: "visual",
        visual: {
          type: "function_plot",
          title: "Graph of y = x^2 - 4 and its roots",
          functions: [{ expr: "x^2 - 4", label: "y = x^2 - 4", color: "#2F7BFF" }],
          x_range: [-4, 4],
          y_range: [-6, 10],
          points: [
            { x: -2, y: 0, label: "Root (-2, 0)" },
            { x: 2, y: 0, label: "Root (2, 0)" },
            { x: 0, y: -4, label: "Vertex (0, -4)" },
          ],
          x_label: "x",
          y_label: "y",
        },
      },
      {
        type: "text",
        text: `## Quick answer  
The parabola $y = x^2 - 4$ intersects the $x$-axis at its two real roots, **$x = -2$** and **$x = 2$**, with its vertex at $(0, -4)$.

## Concept  
A quadratic equation represents a parabola. Its roots (or $x$-intercepts) occur where the curve touches or crosses the line $y = 0$.

:::key
Setting $y = 0$ gives $x^2 - 4 = 0$, factoring as difference of squares: $(x-2)(x+2) = 0$.
:::

## Solution  
### Step 1: Set equation to zero
Set $y = 0$:
$$ x^2 - 4 = 0 $$

### Step 2: Solve for x
Add $4$ to both sides and take the square root:
$$ x^2 = 4 \\implies x = \\pm 2 $$

## Common mistake  
:::warning
Forgetting the negative root when taking the square root. Both $x = +2$ and $x = -2$ are valid roots.
:::

## Final answer  
:::answer
**Final answer:** Roots at $(-2, 0)$ and $(2, 0)$; vertex at $(0, -4)$.
:::`,
      },
    ],
  },
  {
    id: "sine-shade",
    query: "Area under sin x from 0 to pi",
    title: "2. Shaded Integral (sin x from 0 to π)",
    category: "Calculus",
    parts: [
      {
        type: "visual",
        visual: {
          type: "function_plot",
          title: "Area under y = sin(x) from 0 to π",
          functions: [{ expr: "sin(x)", label: "y = sin(x)", color: "#12A150" }],
          x_range: [-0.5, 3.8],
          y_range: [-0.3, 1.4],
          points: [
            { x: 0, y: 0, label: "(0, 0)" },
            { x: 3.14159, y: 0, label: "(π, 0)" },
            { x: 1.57079, y: 1, label: "Peak (π/2, 1)" },
          ],
          shade: { fn: 0, from: 0, to: 3.14159 },
          x_label: "x",
          y_label: "y",
        },
      },
      {
        type: "text",
        text: `## Quick answer  
The exact area under $y = \\sin(x)$ from $x = 0$ to $x = \\pi$ is **2 square units**.

## Concept  
The definite integral computes the net accumulated area between the curve and the $x$-axis.

:::key
$$ \\int_{0}^{\\pi} \\sin(x) \\, dx = [-\\cos(x)]_{0}^{\\pi} = -(-1) - (-1) = 2 $$
:::

## Final answer  
:::answer
**Final answer:** $2$ square units
:::`,
      },
    ],
  },
  {
    id: "intersection",
    query: "Where do y = 2x + 1 and y = x^2 - 2 meet?",
    title: "3. Curve Intersections (y = 2x+1 & y = x^2-2)",
    category: "Algebra",
    parts: [
      {
        type: "visual",
        visual: {
          type: "function_plot",
          title: "Intersection of y = 2x + 1 and y = x^2 - 2",
          functions: [
            { expr: "2*x + 1", label: "y = 2x + 1", color: "#2F7BFF" },
            { expr: "x^2 - 2", label: "y = x^2 - 2", color: "#E5484D" },
          ],
          x_range: [-3, 5],
          y_range: [-4, 10],
          points: [
            { x: 3, y: 7, label: "Intersection (3, 7)" },
            { x: -1, y: -1, label: "Intersection (-1, -1)" },
          ],
          x_label: "x",
          y_label: "y",
        },
      },
      {
        type: "text",
        text: `## Quick answer  
The line and parabola meet at two points: **$(-1, -1)$** and **$(3, 7)$**.

## Solution  
### Step 1: Equate the two functions
$$ x^2 - 2 = 2x + 1 $$
$$ x^2 - 2x - 3 = 0 $$

### Step 2: Factor the quadratic
$$ (x - 3)(x + 1) = 0 \\implies x = 3, \\, x = -1 $$

### Step 3: Find y coordinates
For $x = 3$: $y = 2(3) + 1 = 7 \\implies (3, 7)$.  
For $x = -1$: $y = 2(-1) + 1 = -1 \\implies (-1, -1)$.

## Final answer  
:::answer
**Final answer:** $(3, 7)$ and $(-1, -1)$
:::`,
      },
    ],
  },
  {
    id: "supply-demand",
    query: "Plot supply and demand: Qd = 100 - 2P, Qs = 3P",
    title: "4. Economics Supply & Demand Equilibrium",
    category: "Economics",
    parts: [
      {
        type: "visual",
        visual: {
          type: "function_plot",
          title: "Supply & Demand Market Equilibrium",
          functions: [
            { expr: "100 - 2*x", label: "Demand: Qd = 100 - 2P", color: "#E5484D" },
            { expr: "3*x", label: "Supply: Qs = 3P", color: "#2F7BFF" },
          ],
          x_range: [0, 45],
          y_range: [0, 110],
          points: [
            { x: 20, y: 60, label: "Equilibrium (P=20, Q=60)" },
            { x: 0, y: 100, label: "P=0, Qd=100" },
          ],
          x_label: "Price (P)",
          y_label: "Quantity (Q)",
        },
      },
      {
        type: "text",
        text: `## Quick answer  
Market clearing price is **$P = 20$** and equilibrium quantity is **$Q = 60$ units**.

## Concept  
In market equilibrium, quantity demanded equals quantity supplied: $Q_d = Q_s$.

:::key
$$ 100 - 2P = 3P \\implies 5P = 100 \\implies P = 20 $$
$$ Q = 3(20) = 60 $$
:::

## Final answer  
:::answer
**Final answer:** Price $P = 20$, Quantity $Q = 60$ units
:::`,
      },
    ],
  },
  {
    id: "mitosis",
    query: "Show the stages of mitosis",
    title: "5. Cell Biology Process Diagram (Mitosis)",
    category: "Biology",
    parts: [
      {
        type: "visual",
        visual: {
          type: "diagram",
          title: "Stages of Mitosis & Cell Division",
          mermaid: "flowchart LR\n    Interphase --> Prophase\n    Prophase --> Metaphase\n    Metaphase --> Anaphase\n    Anaphase --> Telophase\n    Telophase --> Cytokinesis",
        },
      },
      {
        type: "text",
        text: `## Quick answer  
Mitosis consists of four sequential stages (**Prophase**, **Metaphase**, **Anaphase**, **Telophase**), preceded by Interphase and completed with Cytokinesis.

## Concept  
:::key
Mitosis produces two genetically identical diploid daughter cells from a single parent cell.
:::

## Stages Breakdown  
1. **Prophase**: Chromatin condenses into visible chromosomes; mitotic spindle begins forming.
2. **Metaphase**: Chromosomes align along the cell equator (metaphase plate).
3. **Anaphase**: Sister chromatids are pulled apart toward opposite poles.
4. **Telophase**: Nuclear envelopes reassemble around the separated chromosomes.
5. **Cytokinesis**: The cytoplasm divides, creating two distinct daughter cells.`,
      },
    ],
  },
  {
    id: "ethanol",
    query: "Draw ethanol",
    title: "6. Chemical Molecule Structure (Ethanol)",
    category: "Chemistry",
    parts: [
      {
        type: "visual",
        visual: {
          type: "molecule",
          smiles: "CCO",
          name: "Ethanol (Ethyl Alcohol)",
        },
      },
      {
        type: "text",
        text: `## Quick answer  
Ethanol is a two-carbon alcohol with chemical formula **$\\text{C}_2\\text{H}_5\\text{OH}$** (SMILES: \`CCO\`).

## Concept  
:::key
Ethanol contains an ethyl alkyl group attached to a polar hydroxyl ($-\\text{OH}$) functional group, making it miscible in water.
:::

## Molecular Properties  
- **Molar Mass**: $46.07\\text{ g/mol}$
- **Boiling Point**: $78.37^\\circ\\text{C}$
- **Functional Group**: Hydroxyl (Alcohol)`,
      },
    ],
  },
  {
    id: "france",
    query: "What is the capital of France?",
    title: "7. Text-Only Question (Capital of France)",
    category: "General Knowledge",
    parts: [
      {
        type: "text",
        text: `## Quick answer  
The capital of France is **Paris**.

## Concept  
Paris is the administrative, political, and cultural center of the French Republic, situated on the Seine River in northern-central France.`,
      },
    ],
  },
  {
    id: "reciprocal",
    query: "Graph 1/x",
    title: "8. Asymptote Graph without connecting lines (y = 1/x)",
    category: "Mathematics",
    parts: [
      {
        type: "visual",
        visual: {
          type: "function_plot",
          title: "Graph of y = 1/x (Hyperbola with Asymptote)",
          functions: [{ expr: "1/x", label: "y = 1/x", color: "#2F7BFF" }],
          x_range: [-5, 5],
          y_range: [-5, 5],
          points: [
            { x: 1, y: 1, label: "(1, 1)" },
            { x: 2, y: 0.5, label: "(2, 0.5)" },
            { x: -1, y: -1, label: "(-1, -1)" },
            { x: -2, y: -0.5, label: "(-2, -0.5)" },
          ],
          vertical_lines: [{ x: 0, label: "x = 0 (Asymptote)" }],
          x_label: "x",
          y_label: "y",
        },
      },
      {
        type: "text",
        text: `## Quick answer  
The graph of $y = \\frac{1}{x}$ is a rectangular hyperbola having a vertical asymptote at $x = 0$ and a horizontal asymptote at $y = 0$.

## Concept  
As $x \\to 0^+$, $y \\to +\\infty$; as $x \\to 0^-$, $y \\to -\\infty$.  
Notice that no vertical connecting line is drawn between $-\\infty$ and $+\\infty$ because the function is undefined at $x = 0$.

:::warning
Never divide by zero. At $x = 0$, the function value does not exist.
:::`,
      },
    ],
  },
  {
    id: "stone-fall",
    query: "Stone fall distance vs time",
    title: "9. Physics Kinematics: Non-uniform Scale (Stone Fall: 0-8s, 0-300m)",
    category: "Physics",
    parts: [
      {
        type: "visual",
        visual: {
          type: "function_plot",
          title: "Stone fall distance vs time",
          functions: [
            { expr: "0.5 * 9.8 * x^2", label: "Free Fall: d = 0.5gt²", color: "#2F7BFF" },
            { expr: "15 * x + 0.5 * 9.8 * x^2", label: "Thrown Down (v₀=15m/s)", color: "#E5484D" },
          ],
          x_range: [0, 8],
          y_range: [0, 300],
          points: [
            { x: 0, y: 0, label: "Release (t=0, d=0)" },
            { x: 7.82, y: 300, label: "Ground (7.82s, 300m)" },
          ],
          x_label: "Time (s)",
          y_label: "Distance (m)",
        },
      },
      {
        type: "text",
        text: `## Quick answer  
A stone dropped from rest ($v_0 = 0$) reaches a distance of **300 meters** in approximately **7.82 seconds**. If thrown downward at $15\\text{ m/s}$, it reaches 300 meters in approximately **6.49 seconds**.

## Concept  
For vertical motion under constant acceleration $g = 9.8\\text{ m/s}^2$:
:::key
$$ d(t) = v_0 t + \\frac{1}{2} g t^2 $$
When dropped from rest ($v_0 = 0$), $d(t) = 4.9 t^2$.
:::

## Solution  
Setting $d = 300$:
$$ 300 = 4.9 t^2 \\implies t^2 = \\frac{300}{4.9} \\approx 61.22 \\implies t \\approx 7.82\\text{ s} $$

## Final answer  
:::answer
**Final answer:** Time to fall $300\\text{ m}$ is $\\approx 7.82\\text{ s}$.
:::`,
      },
    ],
  },
];

export default function VisualsPreviewPage() {
  const [activeTab, setActiveTab] = useState(TEST_CASES[0].id);
  const [isDark, setIsDark] = useState(false);

  const currentCase = TEST_CASES.find((c) => c.id === activeTab) || TEST_CASES[0];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "#121214" : "#F8F8FA",
        color: isDark ? "#F0F0F3" : "#1A1A1E",
        fontFamily: "Inter, sans-serif",
        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: isDark ? "1px solid #282830" : "1px solid #E6E6EB",
          background: isDark ? "#18181C" : "#FFFFFF",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontWeight: 700, fontSize: "17px", color: "#2F7BFF" }}>
            Doubtster
          </span>
          <span
            style={{
              fontSize: "12px",
              padding: "2px 8px",
              borderRadius: "12px",
              background: isDark ? "#282830" : "#F0F0F3",
              color: isDark ? "#A0A0AB" : "#6E6E78",
              fontWeight: 500,
            }}
          >
            Visuals Test Lab
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            id="dark-mode-toggle"
            onClick={() => setIsDark(!isDark)}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: isDark ? "1px solid #3E3E48" : "1px solid #DADADF",
              background: isDark ? "#232328" : "#FFFFFF",
              color: isDark ? "#F0F0F3" : "#1A1A1E",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Test Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "12px",
            marginBottom: "20px",
            scrollbarWidth: "none",
          }}
        >
          {TEST_CASES.map((tc) => (
            <button
              key={tc.id}
              id={`tab-btn-${tc.id}`}
              onClick={() => setActiveTab(tc.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                whiteSpace: "nowrap",
                fontWeight: activeTab === tc.id ? 600 : 500,
                background:
                  activeTab === tc.id
                    ? "#2F7BFF"
                    : isDark
                    ? "#232328"
                    : "#FFFFFF",
                color: activeTab === tc.id ? "#FFFFFF" : isDark ? "#A0A0AB" : "#55555E",
                border:
                  activeTab === tc.id
                    ? "1px solid #2F7BFF"
                    : isDark
                    ? "1px solid #2C2C34"
                    : "1px solid #E2E2E6",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tc.title}
            </button>
          ))}
        </div>

        {/* Current Query Prompt Card */}
        <div
          style={{
            background: isDark ? "#1C1C22" : "#FFFFFF",
            border: isDark ? "1px solid #282830" : "1px solid #DADADF",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#2F7BFF",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              Student Query ({currentCase.category})
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600 }}>
              &ldquo;{currentCase.query}&rdquo;
            </div>
          </div>
          <span
            style={{
              fontSize: "12px",
              padding: "4px 10px",
              borderRadius: "12px",
              background: currentCase.parts.some((p) => p.type === "visual")
                ? "rgba(47, 123, 255, 0.1)"
                : "rgba(110, 110, 120, 0.1)",
              color: currentCase.parts.some((p) => p.type === "visual")
                ? "#2F7BFF"
                : isDark
                ? "#A0A0AB"
                : "#6E6E78",
              fontWeight: 600,
            }}
          >
            {currentCase.parts.some((p) => p.type === "visual")
              ? "✨ Visual Tool Output"
              : "Text-Only (No Visual)"}
          </span>
        </div>

        {/* Answer Container: Matches Doubtster Message Bubble */}
        <div
          id="doubtster-chat-preview-container"
          style={{
            background: isDark ? "#19191E" : "#FFFFFF",
            border: isDark ? "1px solid #26262D" : "1px solid #E4E4E8",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: isDark
              ? "0 4px 20px rgba(0,0,0,0.4)"
              : "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          <AnswerRenderer text="" parts={currentCase.parts} />
        </div>
      </div>
    </div>
  );
}
