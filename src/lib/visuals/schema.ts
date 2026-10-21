import { z } from "zod";

// ============================================================================
// 1. Function Plot Schema (Maths Graphs)
// ============================================================================
export const FunctionItemSchema = z.object({
  expr: z.string().min(1).max(200),
  label: z.string().optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/).optional(),
});

export const PointItemSchema = z.object({
  x: z.number(),
  y: z.number(),
  label: z.string().optional(),
});

export const ShadeItemSchema = z.object({
  fn: z.number().int().nonnegative().optional().default(0),
  from: z.number(),
  to: z.number(),
});

export const VerticalLineItemSchema = z.object({
  x: z.number(),
  label: z.string().optional(),
});

export const FunctionPlotSchema = z.object({
  type: z.literal("function_plot"),
  title: z.string().optional(),
  functions: z.array(FunctionItemSchema).min(1).max(4),
  x_range: z.union([
    z.tuple([z.number(), z.number()]),
    z.array(z.number()).length(2),
  ]).transform((val) => [val[0], val[1]] as [number, number]),
  y_range: z.union([
    z.tuple([z.number(), z.number()]),
    z.array(z.number()).length(2),
  ]).transform((val) => [val[0], val[1]] as [number, number]).optional(),
  points: z.array(PointItemSchema).max(8).optional(),
  shade: ShadeItemSchema.optional(),
  vertical_lines: z.array(VerticalLineItemSchema).optional(),
  x_label: z.string().optional().default("x"),
  y_label: z.string().optional().default("y"),
});

export type FunctionPlotSpec = z.infer<typeof FunctionPlotSchema>;

// ============================================================================
// 2. Data Chart Schema (Statistics, Economics, Science Data)
// ============================================================================
export const DataPointSchema = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.number(),
});

export const SeriesItemSchema = z.object({
  name: z.string(),
  data: z.array(DataPointSchema).min(1).max(200),
});

export const DataChartSchema = z.object({
  type: z.literal("data_chart"),
  chart: z.enum(["line", "bar", "scatter", "pie"]),
  title: z.string().min(1),
  x_label: z.string().optional(),
  y_label: z.string().optional(),
  series: z.array(SeriesItemSchema).min(1).max(6),
});

export type DataChartSpec = z.infer<typeof DataChartSchema>;

// ============================================================================
// 3. Diagram Schema (Process flows, cycles, decision trees - Mermaid)
// ============================================================================
export const DiagramSchema = z.object({
  type: z.literal("diagram"),
  title: z.string().min(1),
  mermaid: z.string().min(1).max(5000),
});

export type DiagramSpec = z.infer<typeof DiagramSchema>;

// ============================================================================
// 4. Molecule Schema (Chemistry - Smiles)
// ============================================================================
export const MoleculeSchema = z.object({
  type: z.literal("molecule"),
  smiles: z.string().min(1).max(500),
  name: z.string().optional(),
});

export type MoleculeSpec = z.infer<typeof MoleculeSchema>;

// ============================================================================
// Discriminated Union
// ============================================================================
export const VisualSpecSchema = z.discriminatedUnion("type", [
  FunctionPlotSchema,
  DataChartSchema,
  DiagramSchema,
  MoleculeSchema,
]);

export type VisualSpec = z.infer<typeof VisualSpecSchema>;

export type MessagePart =
  | { type: "text"; text: string }
  | { type: "visual"; visual: VisualSpec }
  | { type: "placeholder"; message?: string };

/**
 * Validates untrusted visual specification data.
 * Returns the parsed spec on success, or null with error message.
 */
export function validateVisualSpec(raw: unknown): {
  success: true;
  data: VisualSpec;
} | {
  success: false;
  error: string;
} {
  try {
    let input = raw;
    if (typeof raw === "string") {
      try {
        input = JSON.parse(raw);
      } catch (err: any) {
        return { success: false, error: `Invalid JSON string: ${err.message}` };
      }
    }

    const result = VisualSpecSchema.safeParse(input);
    if (!result.success) {
      const issueDetails = result.error.issues
        .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
        .join("; ");
      return { success: false, error: issueDetails };
    }

    return { success: true, data: result.data };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown schema error" };
  }
}
