"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createRoot, Root } from "react-dom/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
import rehypeKatex from "rehype-katex";
import { visit } from "unist-util-visit";
import { VisualCard } from "./visuals/VisualCard";
import { VisualSkeleton } from "./visuals/VisualSkeleton";
import { MessagePart } from "@/lib/visuals/schema";
import { VisualBlock } from "./VisualBlock";
import "@/styles/answer.css";

/* ==========================================================================
   Icons (Accessible SVGs)
   ========================================================================== */
function PinIcon() {
  return (
    <svg className="doubtster-note-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" />
    </svg>
  );
}

function FormulaIcon() {
  return (
    <svg className="doubtster-note-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16v3h-5l-4.5 9 3 4H4v-3h5l4.5-9-3-4H4V4z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="doubtster-note-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg className="doubtster-note-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="doubtster-note-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function HighlighterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 11-6 6v3h3l6-6" />
      <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
    </svg>
  );
}

/* ==========================================================================
   Preprocessor
   ========================================================================== */
export function preprocessAnswerMarkdown(rawText: string): string {
  if (!rawText) return "";
  let text = String(rawText);

  // Normalize LaTeX delimiters \( ... \) -> $ ... $ and \[ ... \] -> $$ ... $$
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$");
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, "\n\n$$$$\n$1\n$$$$\n\n");

  // 1. Separate headings that have text directly on the same line
  // e.g. "## Quick answer The final result is..." -> "## Quick answer\nThe final result is..."
  text = text.replace(
    /^(##\s*(?:Quick answer|Concept|Solution|Check|Common mistake|Final answer))\s+([^\n]+)$/gim,
    "$1\n\n$2"
  );

  // 2. Separate directive tags from headings or text on the same line
  // e.g. "## Common mistake :::warning One mistake" -> "## Common mistake\n\n:::warning\nOne mistake"
  text = text.replace(
    /:::(key|formula|warning|tip|answer)[ \t]*([^\n]*)/gi,
    (match, tag, rest) => {
      const trimmedRest = (rest || "").trim();
      if (trimmedRest) {
        return `\n\n:::${tag.toLowerCase()}\n${trimmedRest}\n`;
      }
      return `\n\n:::${tag.toLowerCase()}\n`;
    }
  );

  // 3. Fallback for bad output: literal "**Step N: ...**" lines to "### Step N: ..."
  text = text.replace(/^[ \t]*\*\*Step\s*(\d+)[:\s]*(.*?)\*\*[ \t]*$/gim, "\n\n### Step $1: $2\n\n");
  text = text.replace(/^[ \t]*\*\*Step\s*(\d+)\*\*[ \t]*$/gim, "\n\n### Step $1\n\n");

  // Fallback for lines like "Step 1: ..." under solutions if not already heading
  text = text.replace(/(?:^|\n)[ \t]*(\bStep\s*\d+:[ \t]*[^\n]+)(?=\n|$)/gi, (match, p1) => {
    return match.startsWith("###") ? match : `\n\n### ${p1.trim()}\n\n`;
  });

  // 4. Ensure closing ::: for each opened ::: block if the LLM forgot to close it
  const lines = text.split("\n");
  const processedLines: string[] = [];
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openMatch = line.trim().match(/^:::(key|formula|warning|tip|answer)$/i);
    const closeMatch = line.trim() === ":::";
    const headingMatch = line.trim().match(/^#{1,3}\s/);

    if (openMatch) {
      if (inBlock) {
        processedLines.push(":::");
      }
      processedLines.push(`:::${openMatch[1].toLowerCase()}`);
      inBlock = true;
      continue;
    }

    if (closeMatch) {
      processedLines.push(":::");
      inBlock = false;
      continue;
    }

    if (headingMatch && inBlock) {
      processedLines.push(":::");
      inBlock = false;
    }

    processedLines.push(line);
  }

  if (inBlock) {
    processedLines.push(":::");
  }

  text = processedLines.join("\n");

  // 5. Replace ==text== with :mark[text] for inline highlights
  text = text.replace(/==([^=\n]+)==/g, ":mark[$1]");

  // 6. Currency protection:
  // If a dollar sign is immediately followed by numbers/commas/decimals (e.g. $30,000 or $11,314),
  // and is NOT a LaTeX math expression like $x = 5$, escape it to \$ so remark-math does not treat it
  // as the opening/closing delimiter of a multi-sentence formula.
  text = text.replace(/(^|[^\\$])\$(\d[\d,]*(?:\.\d+)?)(?!\s*[\=\+\-\*\/\^\\])(?!\s*\\times)(?!\s*\\approx)/g, "$1\\$$2");

  // 7. Clean up any stray dangling double asterisks that could appear raw
  text = text.replace(/^[ \t]*\*\*[ \t]*$/gm, "");

  // 8. No em dashes rule
  text = text.replace(/—/g, " - ");

  // 9. Streaming support: Detect unclosed visual fenced code blocks
  // If a visual block ```chart, ```diagram, ```figure, or ```image is still arriving and unclosed,
  // replace it with a skeleton directive so it renders a skeleton card until the closing fence arrives.
  const visualFenceRegex = /```(chart|diagram|figure|image)/gi;
  let match: RegExpExecArray | null;
  let lastVisualIndex = -1;
  let lastVisualType = "";
  while ((match = visualFenceRegex.exec(text)) !== null) {
    lastVisualIndex = match.index;
    lastVisualType = match[1].toLowerCase();
  }
  if (lastVisualIndex !== -1) {
    const afterFence = text.slice(lastVisualIndex + 3 + lastVisualType.length);
    // If there is no closing ``` after this open fence
    if (!afterFence.includes("```")) {
      text = text.slice(0, lastVisualIndex) + `\n\n:::skeleton-visual[${lastVisualType}]\n:::\n`;
    }
  }

  return text;
}

/* ==========================================================================
   Remark Plugins
   ========================================================================== */

/**
 * Groups "### Step N: <title>" and its following content into a containerDirective node
 * so it renders cleanly as a numbered card.
 */
function remarkStepCards() {
  return (tree: any) => {
    const newChildren: any[] = [];
    let currentStep: any = null;

    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i];

      // Check for h3 starting with "Step N"
      if (child.type === "heading" && child.depth === 3) {
        const textNode = child.children && child.children[0];
        const text = textNode && textNode.value ? textNode.value : "";
        const match = text.match(/^Step\s*(\d+)[:\s]*(.*)$/i);

        if (match) {
          if (currentStep) {
            newChildren.push(currentStep);
          }
          const stepNum = match[1];
          const stepTitle = match[2] ? match[2].trim() : "";
          currentStep = {
            type: "containerDirective",
            name: "step-card",
            attributes: { step: stepNum, title: stepTitle },
            data: {
              hName: "step-card",
              hProperties: {
                stepNumber: stepNum,
                stepTitle: stepTitle,
              },
            },
            children: [],
          };
          continue;
        }
      }

      // Close step card when hitting h1 or h2 or non-step h3
      if (child.type === "heading" && child.depth <= 2 && currentStep) {
        newChildren.push(currentStep);
        currentStep = null;
      }

      if (currentStep) {
        currentStep.children.push(child);
      } else {
        newChildren.push(child);
      }
    }

    if (currentStep) {
      newChildren.push(currentStep);
    }

    tree.children = newChildren;
  };
}

/**
 * Directive handler that transforms :::key, :::formula, :::warning, :::tip, :::answer
 * and :mark[text] into custom hast nodes.
 */
function remarkDirectiveHandler() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective"
      ) {
        const name = (node.name || "").toLowerCase();
        if (name === "mark") {
          node.data = node.data || {};
          node.data.hName = "mark";
          node.data.hProperties = { className: "doubtster-inline-mark" };
        } else if (name === "skeleton-visual") {
          node.data = node.data || {};
          node.data.hName = "visual-skeleton";
          const firstChild = node.children && node.children[0];
          const typeVal = firstChild && firstChild.value ? firstChild.value : "chart";
          node.data.hProperties = { visualType: typeVal };
        } else if (["key", "formula", "warning", "tip", "answer"].includes(name)) {
          node.data = node.data || {};
          node.data.hName = "sticky-note";
          node.data.hProperties = {
            noteType: name,
            ...node.attributes,
          };
        }
      }
    });
  };
}

/* ==========================================================================
   React Components for Sticky Notes and Step Cards
   ========================================================================== */

interface StickyNoteProps {
  type: "key" | "formula" | "warning" | "tip" | "answer";
  children: React.ReactNode;
  index?: number;
  onCopyAnswer?: () => void;
}

interface NoteConfigItem {
  label: string;
  icon: React.ComponentType;
  className: string;
  hasPin?: boolean;
  hasTape?: boolean;
}

const NOTE_CONFIG: Record<string, NoteConfigItem> = {
  key: {
    label: "Key idea",
    icon: PinIcon,
    className: "doubtster-note-key",
    hasPin: true,
  },
  formula: {
    label: "Formula",
    icon: FormulaIcon,
    className: "doubtster-note-formula",
    hasTape: true,
  },
  warning: {
    label: "Common mistake",
    icon: WarningIcon,
    className: "doubtster-note-warning",
    hasPin: true,
  },
  tip: {
    label: "Shortcut / Tip",
    icon: TipIcon,
    className: "doubtster-note-tip",
    hasTape: true,
  },
  answer: {
    label: "FINAL ANSWER",
    icon: CheckIcon,
    className: "doubtster-note-answer",
    hasTape: true,
  },
};

function StickyNote({ type, children, index = 0, onCopyAnswer }: StickyNoteProps) {
  const config = NOTE_CONFIG[type] || NOTE_CONFIG.key;
  const Icon = config.icon;
  const [copied, setCopied] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (onCopyAnswer) {
      onCopyAnswer();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    if (noteRef.current) {
      const text = noteRef.current.innerText || "";
      const cleaned = text.replace(/FINAL ANSWER/i, "").replace(/Copy answer/i, "").trim();
      navigator.clipboard.writeText(cleaned);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      ref={noteRef}
      className={`doubtster-sticky-note ${config.className}`}
      style={{ "--note-idx": index } as React.CSSProperties}
      role="region"
      aria-label={config.label}
    >
      {config.hasPin && <div className="doubtster-note-pin" aria-hidden="true" />}
      {config.hasTape && <div className="doubtster-note-tape" aria-hidden="true" />}

      <div className="doubtster-note-header">
        <div className="doubtster-note-tag">
          <Icon />
          <span className="doubtster-note-label">{config.label}</span>
        </div>

        {type === "answer" && (
          <button
            type="button"
            className="doubtster-copy-btn"
            onClick={handleCopy}
            aria-label="Copy final answer"
          >
            {copied ? (
              <>
                <CheckMiniIcon /> <span>Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon /> <span>Copy answer</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="doubtster-note-content">{children}</div>
    </div>
  );
}

function StepCard({ stepNumber, stepTitle, children }: { stepNumber: string; stepTitle: string; children: React.ReactNode }) {
  return (
    <div className="doubtster-step-card" data-step={stepNumber}>
      <div className="doubtster-step-header">
        <div className="doubtster-step-badge" aria-label={`Step ${stepNumber}`}>
          {stepNumber}
        </div>
        <div className="doubtster-step-title">{stepTitle || `Step ${stepNumber}`}</div>
      </div>
      <div className="doubtster-step-body">{children}</div>
    </div>
  );
}

/* ==========================================================================
   Main AnswerRenderer Component
   ========================================================================== */

export interface AnswerRendererProps {
  text?: string;
  parts?: MessagePart[];
  defaultHighlights?: boolean;
}

function MarkdownSection({
  text,
  onCopyAnswer,
}: {
  text: string;
  onCopyAnswer?: () => void;
}) {
  let noteCounter = 0;
  const processedMarkdown = useMemo(() => {
    return preprocessAnswerMarkdown(text);
  }, [text]);

  return (
    <div className="doubtster-markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkDirectiveHandler, remarkStepCards, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          "sticky-note": ({ noteType, children }: any) => {
            const idx = noteCounter++;
            return (
              <StickyNote
                type={noteType || "key"}
                index={idx}
                onCopyAnswer={noteType === "answer" ? onCopyAnswer : undefined}
              >
                {children}
              </StickyNote>
            );
          },
          "step-card": ({ stepNumber, stepTitle, children }: any) => {
            return (
              <StepCard stepNumber={stepNumber} stepTitle={stepTitle}>
                {children}
              </StepCard>
            );
          },
          mark: ({ children }: any) => {
            return <mark className="doubtster-inline-mark">{children}</mark>;
          },
          h2: ({ children }: any) => {
            return (
              <h2 className="doubtster-h2">
                <span className="doubtster-h2-text">{children}</span>
              </h2>
            );
          },
          h3: ({ children }: any) => {
            return <h3 className="doubtster-h3">{children}</h3>;
          },
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1].toLowerCase() : "";
            if (!inline && ["chart", "diagram", "figure", "image"].includes(lang)) {
              return (
                <VisualCard
                  type={lang as any}
                  rawContent={String(children).replace(/\n$/, "")}
                />
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          "visual-skeleton": ({ visualType }: any) => {
            return <VisualSkeleton type={visualType || "chart"} />;
          },
        } as any}
      >
        {processedMarkdown}
      </ReactMarkdown>
    </div>
  );
}

export function AnswerRenderer({ text = "", parts, defaultHighlights = true }: AnswerRendererProps) {
  const [highlightsEnabled, setHighlightsEnabled] = useState(defaultHighlights);

  // Extract plain text for copy answer fallback
  const handleCopyAnswer = () => {
    const fullText = parts ? parts.filter((p) => p.type === "text").map((p: any) => p.text).join("\n") : text;
    const answerMatch = fullText.match(/:::answer\s*([\s\S]*?):::/i);
    let toCopy = "";
    if (answerMatch && answerMatch[1]) {
      toCopy = answerMatch[1].replace(/\*\*Final answer:\*\*/gi, "").trim();
    } else {
      toCopy = fullText;
    }
    navigator.clipboard.writeText(toCopy);
  };

  const hasParts = Array.isArray(parts) && parts.length > 0;

  return (
    <div className={`doubtster-answer-wrapper ${highlightsEnabled ? "" : "highlights-disabled"}`}>
      <div className="doubtster-answer-toolbar">
        <div className="doubtster-answer-badge">
          <SparklesIcon />
          <span>Doubtster Solution</span>
        </div>
        <button
          type="button"
          className={`doubtster-highlights-toggle ${highlightsEnabled ? "active" : ""}`}
          onClick={() => setHighlightsEnabled(!highlightsEnabled)}
          aria-pressed={highlightsEnabled}
          aria-label="Toggle highlights"
        >
          <HighlighterIcon />
          <span>Highlights {highlightsEnabled ? "ON" : "OFF"}</span>
        </button>
      </div>

      {hasParts ? (
        <div>
          {parts.map((part, pIdx) => {
            if (part.type === "text") {
              return (
                <MarkdownSection
                  key={pIdx}
                  text={part.text}
                  onCopyAnswer={handleCopyAnswer}
                />
              );
            }
            if (part.type === "visual") {
              return <VisualBlock key={pIdx} visual={part.visual} />;
            }
            if (part.type === "placeholder") {
              return (
                <div
                  key={pIdx}
                  className="doubtster-visual-placeholder"
                  style={{
                    background: "#ffffff",
                    border: "1px dashed #2F7BFF",
                    borderRadius: "16px",
                    padding: "20px",
                    margin: "16px 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    color: "#2F7BFF",
                    fontSize: "13.5px",
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #D6E4FF",
                      borderTopColor: "#2F7BFF",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>{part.message || "Drawing the graph..."}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      ) : (
        <MarkdownSection text={text} onCopyAnswer={handleCopyAnswer} />
      )}
    </div>
  );
}

/* ==========================================================================
   DOM Mounting Helpers for Imperative AppEngine Integration
   ========================================================================== */

const rootRegistry = new Map<HTMLElement, Root>();

export function renderAnswerMount(element: HTMLElement, text: string, parts?: MessagePart[]) {
  if (!element) return;
  let root = rootRegistry.get(element);
  if (!root) {
    root = createRoot(element);
    rootRegistry.set(element, root);
  }
  root.render(<AnswerRenderer text={text} parts={parts} />);
}

export function unmountAnswer(element: HTMLElement) {
  if (!element) return;
  const root = rootRegistry.get(element);
  if (root) {
    try {
      root.unmount();
    } catch (e) {
      // ignore
    }
    rootRegistry.delete(element);
  }
}
