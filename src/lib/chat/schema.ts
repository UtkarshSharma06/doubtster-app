import { z } from "zod";

export const IntentEnum = z.enum([
  "SMALL_TALK",
  "NEW_QUESTION",
  "CLARIFY",
  "WHAT_IF",
  "RE_EXPLAIN",
  "REPEAT",
  "META",
]);
export type Intent = z.infer<typeof IntentEnum>;

export const RefersToSchema = z.object({
  messageId: z.string().optional(),
  stepId: z.string().optional(),
  label: z.string().optional(),
});
export type RefersTo = z.infer<typeof RefersToSchema>;

export const IntentClassificationSchema = z.object({
  intent: IntentEnum,
  refersTo: RefersToSchema.optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  level: z.string().optional(),
  language: z.string().default("en"),
  confidence: z.number().default(1.0),
  reason: z.string().optional(),
});
export type IntentClassification = z.infer<typeof IntentClassificationSchema>;

// Chart Schemas
export const FunctionChartSchema = z.object({
  kind: z.literal("function"),
  expr: z.string(),
  xRange: z.tuple([z.number(), z.number()]),
  params: z
    .record(
      z.string(),
      z.object({
        value: z.number(),
        min: z.number(),
        max: z.number(),
        step: z.number(),
      })
    )
    .optional(),
  marks: z.array(z.object({ x: z.number(), label: z.string() })).optional(),
});

export const TrajectoryChartSchema = z.object({
  kind: z.literal("trajectory"),
  v0: z.number(),
  angleDeg: z.number(),
  g: z.number().default(9.8),
  h0: z.number().optional().default(0),
});

export const SeriesChartSchema = z.object({
  kind: z.enum(["line", "bar", "scatter"]),
  series: z.array(
    z.object({
      name: z.string(),
      points: z.array(z.tuple([z.number(), z.number()])),
    })
  ),
  xLabel: z.string().default("x"),
  yLabel: z.string().default("y"),
});

export const VectorChartSchema = z.object({
  kind: z.literal("vector"),
  vectors: z.array(
    z.object({
      from: z.tuple([z.number(), z.number()]),
      to: z.tuple([z.number(), z.number()]),
      label: z.string(),
      color: z.string().optional(),
    })
  ),
});

export const NumberlineOrDiagramChartSchema = z.object({
  kind: z.enum(["numberline", "diagram"]),
  spec: z.any(),
});

export const ChartSchema = z.discriminatedUnion("kind", [
  FunctionChartSchema,
  TrajectoryChartSchema,
  SeriesChartSchema,
  VectorChartSchema,
  NumberlineOrDiagramChartSchema,
]);
export type Chart = z.infer<typeof ChartSchema>;

// Block Schemas
export const GivenBlockSchema = z.object({
  type: z.literal("given"),
  items: z.array(z.object({ label: z.string(), value: z.string() })),
  assumptions: z.array(z.string()).optional(),
});

export const StepItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  why: z.string(),
  math: z.array(z.string()).optional(),
  result: z.string().optional(),
  note: z.string().optional(),
  deeper: z.string().optional(),
});

export const StepsBlockSchema = z.object({
  type: z.literal("steps"),
  steps: z.array(StepItemSchema),
});

export const FigureBlockSchema = z.object({
  type: z.literal("figure"),
  id: z.string(),
  title: z.string(),
  caption: z.string(),
  chart: ChartSchema,
});

export const TableBlockSchema = z.object({
  type: z.literal("table"),
  title: z.string(),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.union([z.string(), z.number()]))),
  highlightRows: z.array(z.number()).optional(),
});

export const CalloutBlockSchema = z.object({
  type: z.literal("callout"),
  tone: z.enum(["warn", "ok", "info"]),
  title: z.string(),
  items: z.array(z.string()),
});

export const CodeBlockSchema = z.object({
  type: z.literal("code"),
  language: z.string(),
  code: z.string(),
  explanation: z.string().optional(),
});

export const TextBlockSchema = z.object({
  type: z.literal("text"),
  md: z.string(),
});

export const BlockSchema = z.discriminatedUnion("type", [
  GivenBlockSchema,
  StepsBlockSchema,
  FigureBlockSchema,
  TableBlockSchema,
  CalloutBlockSchema,
  CodeBlockSchema,
  TextBlockSchema,
]);
export type Block = z.infer<typeof BlockSchema>;

export const ResultTileSchema = z.object({
  label: z.string(),
  value: z.string(),
  unit: z.string().optional(),
  formula: z.string().optional(),
});
export type ResultTile = z.infer<typeof ResultTileSchema>;

export const QuizItemSchema = z.object({
  q: z.string(),
  options: z.array(z.string()),
  answer: z.number(), // index of correct answer
  why: z.string(),
});
export type QuizItem = z.infer<typeof QuizItemSchema>;

export const AnswerSchema = z.object({
  title: z.string(),
  subject: z.string(),
  topic: z.string(),
  level: z.string(),
  summary: z.string(),
  result: z.array(ResultTileSchema),
  blocks: z.array(BlockSchema),
  mistakes: z.array(z.string()).optional(),
  checks: z.array(z.string()).optional(),
  board: z.array(z.string()).optional(),
  quiz: z.array(QuizItemSchema).optional(),
  followUps: z.array(z.string()),
  offerVideo: z.boolean(),
});
export type Answer = z.infer<typeof AnswerSchema>;

// Follow Up (Clarify, What-If, Re-explain, Repeat) Schema
export const FollowUpSchema = z.object({
  intent: IntentEnum,
  refersTo: RefersToSchema.optional(),
  text: z.string(),
  handNote: z.string().optional(),
  timeline: z
    .object({
      leftLabel: z.string(),
      leftColor: z.string().default("#2F7BFF"),
      rightLabel: z.string(),
      rightColor: z.string().default("#1F9D55"),
    })
    .optional(),
  diffTiles: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        diff: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .optional(),
  chart: ChartSchema.optional(),
  analogy: z
    .object({
      leftTitle: z.string(),
      leftDesc: z.string(),
      rightTitle: z.string(),
      rightDesc: z.string(),
      kind: z.string().optional(),
    })
    .optional(),
  followUps: z.array(z.string()).optional(),
});
export type FollowUp = z.infer<typeof FollowUpSchema>;

// Universal chat message
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: Intent;
  intentReason?: string;
  answer?: Answer;
  followUp?: FollowUp;
  createdAt: number;
  refersTo?: RefersTo;
}

