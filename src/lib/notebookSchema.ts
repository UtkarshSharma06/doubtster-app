import { z } from "zod";
import { DoodleSpec, autoDoodle } from "@/components/notes/Doodle";

/* ==========================================================================
   Notebook Notes Schema (notes_v4)
   ========================================================================== */

export const PtSchema = z.object({
  x: z.coerce.number().refine(Number.isFinite, "x must be a finite number"),
  y: z.coerce.number().refine(Number.isFinite, "y must be a finite number").optional(),
  label: z.string().optional(),
  color: z.enum(["red", "green", "purple", "ink"]).optional(),
});

export const DoodleSpecSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("numberline"),
    min: z.coerce.number().refine(Number.isFinite),
    max: z.coerce.number().refine(Number.isFinite),
    step: z.coerce.number().refine(Number.isFinite).optional(),
    points: z.array(PtSchema).default([]),
    caption: z.string().optional(),
  }),
  z.object({
    kind: z.literal("graph"),
    fn: z.string(),
    xmin: z.coerce.number().refine(Number.isFinite),
    xmax: z.coerce.number().refine(Number.isFinite),
    ymin: z.coerce.number().refine(Number.isFinite).optional(),
    ymax: z.coerce.number().refine(Number.isFinite).optional(),
    points: z.array(PtSchema).optional(),
    label: z.string().optional(),
    fn2: z.string().optional(),
    label2: z.string().optional(),
    caption: z.string().optional(),
  }),
  z.object({
    kind: z.literal("balance"),
    left: z.string(),
    right: z.string(),
    note: z.string().optional(),
    caption: z.string().optional(),
  }),
  z.object({
    kind: z.literal("flow"),
    nodes: z.array(z.string()).default([]),
    caption: z.string().optional(),
  }),
  z.object({
    kind: z.literal("concept"),
    center: z.string(),
    parts: z.array(z.object({
      label: z.string(),
      note: z.string().optional(),
    })).default([]),
    caption: z.string().optional(),
  }),
  z.object({
    kind: z.literal("boat"),
    distance: z.string().optional(),
    speed: z.string().optional(),
    caption: z.string().optional(),
  }),
]);

export const StepItemSchema = z.object({
  say: z.string(),
  tex: z.string().optional(),
  eq: z.string().optional(),
});

export type StepItem = z.infer<typeof StepItemSchema>;

export const PracticeItemSchema = z.object({
  q: z.string(),
  a: z.string(),
});

export type PracticeItem = z.infer<typeof PracticeItemSchema>;

export const NotebookBlockSchema = z.object({
  type: z.enum([
    "heading",
    "para",
    "eq",
    "steps",
    "answer",
    "margin",
    "mistakes",
    "doodle",
    "example",
    "summary",
    "practice",
  ]),
  text: z.string().optional(),
  tex: z.string().optional(),
  items: z.array(z.any()).optional(),
  spec: z.any().optional(),
  problem: z.string().optional(),
  steps: z.array(z.any()).optional(),
  answer: z.string().optional(),
});

export type NotebookBlock = z.infer<typeof NotebookBlockSchema>;

export const NotebookPageSchema = z.object({
  blocks: z.array(NotebookBlockSchema),
});

export type NotebookPage = z.infer<typeof NotebookPageSchema>;

export const NotebookDocSchema = z.object({
  title: z.string(),
  shortTitle: z.string().optional(),
  question: z.string().optional(),
  subject: z.string().default("General"),
  chapter: z.string().optional(),
  pageNo: z.string().optional(),
  exampleNo: z.string().optional(),
  level: z.string().optional().default(""),
  language: z.enum(["en", "fr", "es", "hi"]).optional().default("en"),
  pages: z.array(NotebookPageSchema),
  verified: z.boolean().optional(),
  verifiedNote: z.string().optional(),
  needsCheck: z.boolean().optional(),
});

export type NotebookDoc = z.infer<typeof NotebookDocSchema>;

/* ==========================================================================
   Tolerant JSON Parser for LLM Output
   ========================================================================== */

export function parseNotebookJson(raw: string): any {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }

  // Find outer JSON braces
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    try {
      // Double backslashes in LaTeX formulas that aren't valid JSON escapes
      let repaired = cleaned.replace(/\\([a-zA-Z]+|\{|\}|\[|\]|\$)/g, "\\\\$1");
      // Remove trailing commas before } or ]
      repaired = repaired.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(repaired);
    } catch (err2) {
      throw new Error(`Failed to parse notebook JSON: ${(err1 as Error).message}`);
    }
  }
}

/* ==========================================================================
   Clean & Sanitize Text Fields
   ========================================================================== */

export function cleanText(str?: string): string {
  if (!str) return "";
  return String(str)
    // Strip markdown markers (keep **bold** and ==highlight==)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^:::[a-zA-Z0-9_-]*/gm, "")
    .replace(/---{2,}/g, "")
    // No HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // No em dashes (replace with space hyphen space or standard punctuation)
    .replace(/—/g, " - ")
    // No "..." truncation
    .replace(/\.{3,}/g, ".")
    .replace(/…/g, ".")
    .trim();
}

/* ==========================================================================
   Sanitize Notebook Doc (Enforce Doodles & Content Quality)
   ========================================================================== */

export function sanitizeNotebookDoc(doc: any): NotebookDoc {
  const rawTitle = cleanText(String(doc.title || "Study Notes"));
  const titleWords = rawTitle.split(/\s+/);
  const shortTitle = cleanText(doc.shortTitle) || (titleWords.length > 8 ? titleWords.slice(0, 6).join(" ") : rawTitle);
  const question = cleanText(doc.question) || (titleWords.length > 8 && !doc.question ? rawTitle : "");
  const subject = cleanText(String(doc.subject || "General"));
  const level = String(doc.level || "");
  const language = ["en", "fr", "es", "hi"].includes(doc.language) ? doc.language : "en";

  let rawPages = Array.isArray(doc.pages) && doc.pages.length > 0 ? doc.pages : null;
  if (!rawPages && Array.isArray(doc.blocks) && doc.blocks.length > 0) {
    rawPages = [{ blocks: doc.blocks }];
  }
  if (!rawPages) {
    rawPages = [{ blocks: [] }];
  }
  const pages: NotebookPage[] = [];

  for (const p of rawPages) {
    const blocks: NotebookBlock[] = [];
    const rawBlocks = Array.isArray(p.blocks) ? p.blocks : [];
    let pageHasDoodle = false;
    let pageAnswer = "";
    const pageSteps: string[] = [];

    for (const b of rawBlocks) {
      if (!b || typeof b !== "object" || !b.type) continue;

      switch (b.type) {
        case "heading": {
          const text = cleanText(b.text);
          if (text) blocks.push({ type: "heading", text });
          break;
        }
        case "para": {
          const text = cleanText(b.text);
          if (text) blocks.push({ type: "para", text });
          break;
        }
        case "eq": {
          const tex = b.tex || b.text || b.eq ? String(b.tex || b.text || b.eq).trim() : "";
          if (tex) blocks.push({ type: "eq", tex });
          break;
        }
        case "steps": {
          const items = Array.isArray(b.items)
            ? b.items.map((it: any) => {
                const say = cleanText(it.say || it.step || "");
                const tex = it.tex || it.eq || it.math ? String(it.tex || it.eq || it.math).trim() : undefined;
                if (say) pageSteps.push(say);
                return { say, tex, eq: tex };
              }).filter((it: any) => it.say || it.tex)
            : [];
          if (items.length > 0) blocks.push({ type: "steps", items });
          break;
        }
        case "answer": {
          const text = cleanText(b.text);
          const tex = b.tex ? String(b.tex).trim() : undefined;
          if (text || tex) {
            pageAnswer = text || tex || "";
            blocks.push({ type: "answer", text: text || tex, tex });
          }
          break;
        }
        case "margin": {
          // under 12 words: tip, mnemonic or exam trap
          const words = cleanText(b.text).split(/\s+/).slice(0, 16).join(" ");
          if (words) blocks.push({ type: "margin", text: words });
          break;
        }
        case "mistakes": {
          const items = Array.isArray(b.items)
            ? b.items.map((it: any) => cleanText(String(it))).filter(Boolean)
            : [];
          if (items.length > 0) blocks.push({ type: "mistakes", items });
          break;
        }
        case "doodle": {
          const rawSpec = b.spec;
          if (rawSpec && typeof rawSpec === "object" && rawSpec.kind) {
            let cleanedSpec: any = { ...rawSpec };
            if (cleanedSpec.kind === "flow") {
              const nodes = Array.isArray(cleanedSpec.nodes)
                ? cleanedSpec.nodes.map((n: any) => cleanText(String(n)).slice(0, 24)).filter(Boolean)
                : ["Start", "Step", "Result"];
              cleanedSpec.nodes = nodes.slice(0, 5);
            } else if (cleanedSpec.kind === "concept") {
              cleanedSpec.center = cleanText(String(cleanedSpec.center || "Concept")).slice(0, 24);
              const parts = Array.isArray(cleanedSpec.parts)
                ? cleanedSpec.parts.map((p: any) => ({
                    label: cleanText(String(p?.label || "")).slice(0, 24),
                    note: p?.note ? cleanText(String(p.note)).slice(0, 24) : undefined,
                  })).filter((p: any) => p.label)
                : [{ label: "Input" }, { label: "Output" }];
              cleanedSpec.parts = parts.slice(0, 6);
            } else if (cleanedSpec.kind === "balance") {
              cleanedSpec.left = cleanText(String(cleanedSpec.left || "")).slice(0, 24);
              cleanedSpec.right = cleanText(String(cleanedSpec.right || "")).slice(0, 24);
              if (cleanedSpec.note) cleanedSpec.note = cleanText(String(cleanedSpec.note)).slice(0, 24);
            }
            if (cleanedSpec.caption) {
              cleanedSpec.caption = cleanText(String(cleanedSpec.caption));
            }
            const specValidation = DoodleSpecSchema.safeParse(cleanedSpec);
            if (specValidation.success) {
              blocks.push({
                type: "doodle",
                spec: specValidation.data,
              });
              pageHasDoodle = true;
            }
          }
          break;
        }
        case "example": {
          const problem = cleanText(b.problem);
          const answer = cleanText(b.answer);
          const steps = Array.isArray(b.steps)
            ? b.steps.map((st: any) => {
                if (typeof st === "string") return { say: cleanText(st) };
                return {
                  say: cleanText(st.say || st.step || ""),
                  eq: st.eq || st.math ? cleanText(st.eq || st.math) : undefined,
                };
              })
            : [];
          blocks.push({
            type: "example",
            problem,
            steps,
            answer,
          });
          break;
        }
        case "summary": {
          const items = Array.isArray(b.items)
            ? b.items.map((it: any) => cleanText(String(it))).filter(Boolean)
            : [];
          if (items.length > 0) blocks.push({ type: "summary", items });
          break;
        }
        case "practice": {
          const items = Array.isArray(b.items)
            ? b.items.map((it: any) => ({
                q: cleanText(it.q || it.question),
                a: cleanText(it.a || it.answer),
              })).filter((it: any) => it.q)
            : [];
          if (items.length > 0) blocks.push({ type: "practice", items });
          break;
        }
      }
    }

    // STEP 2 MANDATE: Every page must contain at least one doodle!
    // If a page has no doodle, insert autoDoodle(...) from Doodle.tsx
    if (!pageHasDoodle) {
      const fallbackSpec = autoDoodle({
        answer: pageAnswer || undefined,
        steps: pageSteps.length > 0 ? pageSteps : undefined,
        title: rawTitle,
      });
      // Place doodle after first heading or after steps/para
      const insertIdx = Math.min(blocks.length, 3);
      blocks.splice(insertIdx, 0, { type: "doodle", spec: fallbackSpec });
    }

    if (blocks.length > 0) {
      pages.push({ blocks });
    }
  }

  return {
    title: rawTitle,
    shortTitle,
    question,
    subject,
    level,
    language,
    pages: pages.length > 0 ? pages : [{ blocks: [{ type: "para", text: "Writing handwritten notes..." }] }],
    verified: doc.verified,
    verifiedNote: doc.verifiedNote,
    needsCheck: doc.needsCheck,
  };
}

/* ==========================================================================
   Export Notebook to Clean Markdown (for Download / Copy)
   ========================================================================== */

export function notebookDocToMarkdown(doc: NotebookDoc): string {
  let md = `# ${doc.title}\n\n**Subject:** ${doc.subject}${doc.level ? ` | **Level:** ${doc.level}` : ""}\n\n---\n\n`;

  doc.pages.forEach((p, pIdx) => {
    if (doc.pages.length > 1) {
      md += `\n## Sheet ${pIdx + 1}\n\n`;
    }

    p.blocks.forEach((b) => {
      switch (b.type) {
        case "heading":
          md += `\n### ${b.text}\n\n`;
          break;
        case "para":
          md += `${b.text}\n\n`;
          break;
        case "steps":
          md += `\n**Steps:**\n`;
          (b.items || []).forEach((st: any, idx: number) => {
            md += `${idx + 1}. **${st.say}**\n`;
            if (st.eq) md += `   $$\n   ${st.eq}\n   $$\n`;
          });
          md += `\n`;
          break;
        case "answer":
          md += `\n> **Result:** ${b.text}\n\n`;
          break;
        case "margin":
          md += `*[Margin note: ${b.text}]*\n\n`;
          break;
        case "mistakes":
          md += `\n**Common Mistakes to Avoid:**\n`;
          (b.items || []).forEach((m: string) => {
            md += `- ${m}\n`;
          });
          md += `\n`;
          break;
        case "example":
          md += `\n**Worked Example:** ${b.problem}\n\n`;
          if (Array.isArray(b.steps)) {
            b.steps.forEach((st: any, idx: number) => {
              md += `${idx + 1}. ${typeof st === "string" ? st : st.say || st.step || ""}\n`;
              if (st && st.eq) md += `   $$ ${st.eq} $$\n`;
            });
          }
          if (b.answer) md += `\n**Answer:** ${b.answer}\n\n`;
          break;
        case "summary":
          md += `\n**Key Takeaways:**\n`;
          (b.items || []).forEach((item: string) => {
            md += `- ${item}\n`;
          });
          md += `\n`;
          break;
        case "practice":
          md += `\n**Practice Problems:**\n`;
          (b.items || []).forEach((it: any, idx: number) => {
            md += `Q${idx + 1}: ${it.q}\nAns: ${it.a}\n\n`;
          });
          break;
        case "doodle":
          if (b.spec && b.spec.caption) md += `*[Diagram: ${b.spec.caption}]*\n\n`;
          break;
      }
    });
  });

  return md.trim() + "\n";
}
