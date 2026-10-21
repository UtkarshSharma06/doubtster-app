/**
 * Tool definition and system prompt addition for the chat model's visual generation capability.
 */

export const SHOW_VISUAL_TOOL = {
  type: "function",
  function: {
    name: "show_visual",
    description:
      "Display an inline interactive mathematical graph (e.g. functions, roots, intersections, supply and demand curves, calculus areas), data chart, process diagram (e.g. mitosis stages, life cycles, flowcharts), or chemical molecule structure.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["function_plot", "data_chart", "diagram", "molecule"],
          description:
            "The visual kind: 'function_plot' for math & economics graphs (e.g. parabolas, intersections, supply and demand, 1/x), 'data_chart' for statistics/economics data, 'diagram' for process flowcharts/cycles/trees/stages, 'molecule' for chemistry SMILES.",
        },
        // function_plot properties
        title: {
          type: "string",
          description: "Title of the visual (e.g. 'Roots of y = x^2 - 4' or 'Supply & Demand Equilibrium').",
        },
        functions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              expr: {
                type: "string",
                description: "Math.js expression in x (e.g. 'x^2 - 4', 'sin(x)', '2*x + 1').",
              },
              label: { type: "string", description: "Label for the curve (e.g. 'y = x^2 - 4')." },
              color: { type: "string", description: "Optional hex color." },
            },
            required: ["expr"],
          },
          description: "1 to 4 functions to plot simultaneously on the same axes.",
        },
        x_range: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2,
          description: "Domain bounds [minX, maxX] (e.g. [-5, 5]).",
        },
        y_range: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2,
          description: "Optional range bounds [minY, maxY]. If omitted, auto-fitted.",
        },
        points: {
          type: "array",
          items: {
            type: "object",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              label: { type: "string" },
            },
            required: ["x", "y"],
          },
          description: "Important points to highlight (roots, intercepts, extrema, intersections). Max 8.",
        },
        shade: {
          type: "object",
          properties: {
            fn: { type: "number", description: "Index of function in 'functions' array (default 0)." },
            from: { type: "number", description: "Start of shaded area (e.g. 0)." },
            to: { type: "number", description: "End of shaded area (e.g. 3.14159)." },
          },
          required: ["from", "to"],
          description: "Area under a curve to shade with semi-transparent tint.",
        },
        vertical_lines: {
          type: "array",
          items: {
            type: "object",
            properties: {
              x: { type: "number" },
              label: { type: "string" },
            },
            required: ["x"],
          },
          description: "Vertical lines (asymptotes, boundary conditions).",
        },
        x_label: { type: "string", description: "Label for horizontal axis (e.g. 'x' or 'Quantity (Q)')." },
        y_label: { type: "string", description: "Label for vertical axis (e.g. 'y' or 'Price (P)')." },

        // data_chart properties
        chart: {
          type: "string",
          enum: ["line", "bar", "scatter", "pie"],
          description: "Type of data chart.",
        },
        series: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    x: { type: ["string", "number"] },
                    y: { type: "number" },
                  },
                  required: ["x", "y"],
                },
              },
            },
            required: ["name", "data"],
          },
          description: "Data series to plot (max 6 series, 200 points each).",
        },

        // diagram properties
        mermaid: {
          type: "string",
          description: "Mermaid syntax (e.g. 'flowchart LR; A-->B').",
        },

        // molecule properties
        smiles: {
          type: "string",
          description: "SMILES string representation of the molecule (e.g. 'CCO' for ethanol).",
        },
        name: {
          type: "string",
          description: "Name of the chemical compound.",
        },
      },
      required: ["type"],
    },
  },
};

export const VISUALS_SYSTEM_PROMPT = `You can call show_visual when a picture makes the answer clearer: graphing a function, showing roots, intercepts, intersections or area under a curve, comparing data, showing a trend, a process or cycle, or a molecule.
When the user asks to "Plot", "Graph", "Draw", or asks for "stages", "cycle", or "diagram" (such as "Plot supply and demand", "Show the stages of mitosis", "Graph 1/x", "Graph y = x^2 - 4", "Area under sin x", "Draw ethanol"):
- Always call show_visual.
- For math & economics curves: use type "function_plot". For supply and demand Qd = 100 - 2P and Qs = 3P, convert to functions of x (e.g. let x be Quantity Q or Price P; if x is Price P: Demand Qd = 100 - 2*x, Supply Qs = 3*x, with intersection point (20, 60); or if x is Quantity Q: P = 50 - 0.5*x, P = x/3).
- For processes, life cycles, cell divisions, workflows: use type "diagram" with mermaid syntax (e.g. flowchart LR; Interphase-->Prophase-->Metaphase-->Anaphase-->Telophase-->Cytokinesis).
- For chemical compounds: use type "molecule" with SMILES string (e.g. CCO for ethanol).
Do not call it for questions that are clearer as text (like factual questions or geography, e.g. "What is the capital of France?"). Use at most 2 visuals per answer. Expressions use x as the variable and math.js syntax (^ for powers, sin, cos, tan, log, ln, sqrt, abs, exp, pi, e). Choose ranges that show the interesting parts (roots, turning points, intersections). The numbers in the visual must match the numbers in your written answer. Still explain everything in text; the visual supports the explanation, it never replaces it.`;
