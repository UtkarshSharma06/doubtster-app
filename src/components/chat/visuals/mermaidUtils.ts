/**
 * mermaidUtils.ts
 * Shared utilities for safely sanitizing, cleaning up, and rendering Mermaid diagrams in Doubtster.
 */

export function sanitizeMermaidCode(raw: string): string {
  if (!raw) return "";
  let code = raw.trim();

  // 1. Remove markdown fences
  if (code.startsWith("```mermaid")) code = code.replace(/^```mermaid\s*/i, "");
  if (code.startsWith("```diagram")) code = code.replace(/^```diagram\s*/i, "");
  if (code.startsWith("```")) code = code.replace(/^```\s*/, "");
  if (code.endsWith("```")) code = code.replace(/\s*```$/, "");

  code = code.trim();

  // 2. Auto-quote unquoted edge labels: e.g. -->|वजन (W) downward|  =>  -->|"वजन (W) downward"|
  code = code.replace(/(\|)([^"\n\r|]+)(\|)/g, (_match, p1, inner, p3) => {
    const trimmed = inner.trim();
    if (!trimmed) return `${p1}${p3}`;
    const escaped = trimmed.replace(/"/g, "'");
    return `${p1}"${escaped}"${p3}`;
  });

  // Also handle -- label --> syntax
  code = code.replace(
    /(--\s*)([A-Za-z0-9\u0900-\u097F\s\(\)\-_=\+]+?)(\s*-->)/g,
    (match, prefix, inner, suffix) => {
      const trimmed = inner.trim();
      if (!trimmed || trimmed.startsWith('"') || trimmed.endsWith('"')) return match;
      if (
        trimmed.includes("(") ||
        trimmed.includes(")") ||
        trimmed.includes("=") ||
        /[\u0900-\u097F]/.test(trimmed)
      ) {
        return `${prefix}"${trimmed.replace(/"/g, "'")}"${suffix}`;
      }
      return match;
    }
  );

  // 3. Ensure a valid diagram declaration exists at the start
  const lines = code.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] ? lines[0].toLowerCase() : "";
  const validStarters = [
    "graph",
    "flowchart",
    "sequencediagram",
    "classdiagram",
    "statediagram",
    "erdiagram",
    "journey",
    "gantt",
    "pie",
    "quadrantchart",
    "requirementdiagram",
    "gitgraph",
    "c4context",
    "mindmap",
    "timeline",
    "zenuml",
    "sankey-beta",
    "xychart-beta",
    "block-beta",
  ];

  const hasStarter = validStarters.some(
    (starter) => firstLine.startsWith(starter) || firstLine.startsWith(`${starter} `)
  );

  if (!hasStarter) {
    code = `flowchart TD\n${code}`;
  }

  return code;
}

export function cleanupStrayMermaidElements(id?: string) {
  if (typeof document === "undefined") return;
  try {
    const selectors = [
      "[id^='dmermaid-']",
      "[id^='mermaid-error-']",
      ...(id ? [`#d${id}`] : []),
    ];
    document.querySelectorAll(selectors.join(", ")).forEach((el) => {
      // Don't remove if it is our active rendered container
      if (
        el.closest(".doubtster-diagram-viewport") ||
        el.closest(".doubtster-mermaid-container")
      ) {
        return;
      }
      el.remove();
    });
  } catch (e) {
    // Ignore DOM cleanup exceptions
  }
}

export function isMermaidErrorSvg(svg: string): boolean {
  if (!svg) return true;
  return (
    svg.includes("Syntax error in text") ||
    svg.includes("mermaid version") ||
    svg.includes("Parse error on line") ||
    svg.includes("error-icon") ||
    svg.includes("class=\"error-text\"")
  );
}
