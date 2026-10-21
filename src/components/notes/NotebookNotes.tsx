"use client";

import React, { useState, useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { NotebookDoc, NotebookBlock, notebookDocToMarkdown } from "@/lib/notebookSchema";
import { Doodle, DoodleSpec, autoDoodle } from "./Doodle";
import "@/styles/notebook.css";

/* ==========================================================================
   Helper: Format inline bold, highlights, and KaTeX math ($...$)
   ========================================================================== */

export function MathText({ text }: { text?: string }) {
  if (!text) return null;

  // Split on math expressions ($...$), highlights (==...==), bold (**...**), and underlines (__...__ or <u>...</u>)
  const tokens = text.split(/(\$[^$]+\$|==.*?==|\*\*.*?\*\*|__.*?__|<u>.*?<\/u>)/g);

  return (
    <>
      {tokens.map((token, i) => {
        if (token.startsWith("$") && token.endsWith("$") && token.length > 2) {
          const mathExpr = token.slice(1, -1);
          try {
            const html = katex.renderToString(mathExpr, {
              throwOnError: false,
              displayMode: false,
            });
            return <span key={i} className="k-inline" dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <span key={i}>{token}</span>;
          }
        }
        if (token.startsWith("==") && token.endsWith("==")) {
          const inner = token.slice(2, -2);
          return (
            <span key={i} className="hl">
              <MathText text={inner} />
            </span>
          );
        }
        if (token.startsWith("**") && token.endsWith("**")) {
          const inner = token.slice(2, -2);
          return (
            <b key={i}>
              <MathText text={inner} />
            </b>
          );
        }
        if ((token.startsWith("__") && token.endsWith("__")) || (token.startsWith("<u>") && token.endsWith("</u>"))) {
          const inner = token.startsWith("__") ? token.slice(2, -2) : token.slice(3, -4);
          return (
            <span key={i} className="pen-underline">
              <MathText text={inner} />
            </span>
          );
        }
        return token;
      })}
    </>
  );
}

export function SolBadge() {
  return (
    <span className="sol-badge" aria-label="Solution:">
      <span className="sol-glyph">Sol</span>
      <span className="sol-colon">:</span>
      <svg className="sol-flourish" viewBox="0 0 46 14" fill="none" aria-hidden="true">
        <path d="M 3 6 C 14 13, 30 13, 42 5 C 30 10, 16 10, 5 7" stroke="var(--ink, #1976D2)" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function MathEq({ tex, fallback }: { tex?: string; fallback?: string }) {
  const content = (tex || fallback || "").trim();
  if (!content) return null;

  try {
    const html = katex.renderToString(content, {
      throwOnError: false,
      displayMode: true,
    });
    return <span className="k-display" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span>{content}</span>;
  }
}

/* ==========================================================================
   Doodle Error Boundary
   ========================================================================== */

interface DoodleErrorBoundaryProps {
  fallbackSpec: DoodleSpec;
  children: React.ReactNode;
}

interface DoodleErrorBoundaryState {
  hasError: boolean;
}

class DoodleErrorBoundary extends React.Component<DoodleErrorBoundaryProps, DoodleErrorBoundaryState> {
  constructor(props: DoodleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("Doodle render failed, using autoDoodle fallback:", error);
  }

  componentDidUpdate(prevProps: DoodleErrorBoundaryProps) {
    if (prevProps.fallbackSpec !== this.props.fallbackSpec && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return <Doodle spec={this.props.fallbackSpec} />;
    }
    return this.props.children;
  }
}

/* ==========================================================================
   NotebookNotes Component
   ========================================================================== */

export interface NotebookNotesProps {
  note: NotebookDoc;
  onClose?: () => void;
  onRetry?: () => void;
  onMakeVideo?: () => void;
  onMakeDeck?: () => void;
  onMakeQuiz?: () => void;
}

export function NotebookNotes({
  note,
  onClose,
  onRetry,
}: NotebookNotesProps) {
  const [activePage, setActivePage] = useState(0);
  const [fontSize, setFontSize] = useState(20);
  const [showHighlighter, setShowHighlighter] = useState(true);
  const [paperMode, setPaperMode] = useState<"whiteboard" | "ruled" | "dark">("whiteboard");
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [practiceInputs, setPracticeInputs] = useState<Record<number, string>>({});
  const [practiceFeedback, setPracticeFeedback] = useState<Record<number, { ok: boolean; msg: string }>>({});
  const [copiedText, setCopiedText] = useState(false);
  const paperRef = useRef<HTMLElement>(null);

  const pages = note.pages && note.pages.length > 0 ? note.pages : [{ blocks: [] }];
  const totalPages = pages.length;
  const currentPage = pages[activePage] || pages[0] || { blocks: [] };

  // Sync font size to CSS variable on document
  useEffect(() => {
    document.documentElement.style.setProperty("--fs", `${fontSize}px`);
  }, [fontSize]);

  // Handle write animation
  const runWriteAnimation = () => {
    if (!paperRef.current) return;
    const paper = paperRef.current;
    const rowsAndDoodles = paper.querySelectorAll<HTMLElement>(".sheet:not([hidden]) .row, .sheet:not([hidden]) .doodle");

    rowsAndDoodles.forEach((el, idx) => {
      el.style.setProperty("--i", `${idx}`);
    });

    paper.classList.remove("writing");
    void paper.offsetWidth; // Force reflow
    paper.classList.add("writing");

    const totalDuration = 700 + rowsAndDoodles.length * 180 + 100;
    setTimeout(() => {
      paper.classList.remove("writing");
    }, totalDuration);
  };

  const handleCopy = () => {
    const md = notebookDocToMarkdown(note);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(md).then(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 1500);
      });
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleExportMd = () => {
    const md = notebookDocToMarkdown(note);
    const slug = (note.shortTitle || note.title || "notes")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 30);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const toggleAnswer = (idx: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const checkPractice = (idx: number, expectedAnswer: string) => {
    const rawVal = practiceInputs[idx] || "";
    const cleanVal = rawVal.replace(/[^0-9.\-]/g, "");
    if (!cleanVal) {
      setPracticeFeedback((prev) => ({
        ...prev,
        [idx]: { ok: false, msg: "Type an answer first." },
      }));
      return;
    }
    const numVal = parseFloat(cleanVal);
    const expectedNum = parseFloat(expectedAnswer.replace(/[^0-9.\-]/g, ""));

    if (!isNaN(expectedNum) && Math.abs(numVal - expectedNum) < 0.05) {
      setPracticeFeedback((prev) => ({
        ...prev,
        [idx]: { ok: true, msg: `✓ Correct! ${expectedAnswer}` },
      }));
    } else {
      setPracticeFeedback((prev) => ({
        ...prev,
        [idx]: { ok: false, msg: "✗ Check your steps and try again." },
      }));
    }
  };

  // Group margin notes and content blocks
  const marginBlocks = (currentPage.blocks || []).filter((b) => b.type === "margin");
  const contentBlocks = (currentPage.blocks || []).filter((b) => b.type !== "margin");

  // Distribute margin notes to rows
  let marginIdx = 0;
  const getNextMargin = () => {
    if (marginIdx < marginBlocks.length) {
      const text = marginBlocks[marginIdx].text;
      marginIdx++;
      return text;
    }
    return null;
  };

  // Build fallback doodle spec
  const fallbackSpec = autoDoodle({
    title: note.title,
    answer: contentBlocks.find((b) => b.type === "answer")?.text,
    steps: contentBlocks.find((b) => b.type === "steps")?.items?.map((it: any) => it.say || it.eq || ""),
  });

  // Short title calculation (max 8 words)
  const fullTitle = note.title || "Study Notes";
  const titleWords = fullTitle.split(/\s+/);
  const displayTitle = note.shortTitle || (titleWords.length > 8 ? titleWords.slice(0, 6).join(" ") : fullTitle);
  const questionText = note.question || (titleWords.length > 8 ? fullTitle : "");

  return (
    <div className="doubtster-notes-shell">
      {/* Sticky Top Toolbar (.bar) */}
      <div className="bar" role="toolbar" aria-label="Notes controls">
        <div className="grp">
          {onClose && (
            <button type="button" onClick={onClose} title="Back to library">
              &larr; Back
            </button>
          )}
          <button type="button" onClick={handleCopy} title="Copy notes as markdown">
            {copiedText ? "Copied" : "Copy text"}
          </button>
          <button type="button" onClick={handleDownloadPdf} title="Download notes as PDF">
            Download PDF
          </button>
          <button type="button" onClick={handleExportMd} title="Export markdown file">
            Export .md
          </button>
          {onRetry && (
            <button type="button" onClick={onRetry} title="Regenerate notes">
              Regenerate
            </button>
          )}
        </div>

        <div className="grp">
          <label htmlFor="fs">
            Size{" "}
            <input
              id="fs"
              type="range"
              min="16"
              max="28"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              aria-label="Font size"
            />
          </label>
          <button
            type="button"
            id="hlbtn"
            aria-pressed={showHighlighter}
            className={showHighlighter ? "on" : ""}
            onClick={() => setShowHighlighter(!showHighlighter)}
            title="Toggle highlighter marks"
          >
            Highlighter
          </button>
          <button
            type="button"
            id="papbtn"
            onClick={() => {
              setPaperMode((prev) => (prev === "whiteboard" ? "ruled" : prev === "ruled" ? "dark" : "whiteboard"));
            }}
            title="Switch canvas style (Whiteboard, Ruled Paper, Dark Board)"
          >
            {paperMode === "whiteboard" ? "Whiteboard" : paperMode === "ruled" ? "Ruled Paper" : "Dark Board"}
          </button>
          <button
            type="button"
            id="replay"
            onClick={runWriteAnimation}
            title="Watch the notes get written"
          >
            Write it out
          </button>
        </div>
      </div>

      {/* Ruled Paper / Digital Whiteboard Sheet (.paper) */}
      <main
        ref={paperRef}
        className={`paper ${!showHighlighter ? "nohl" : ""}`}
        data-paper={paperMode}
        style={
          {
            "--fs": `${fontSize}px`,
            "--lh": `calc(${fontSize}px * 1.8)`,
          } as React.CSSProperties
        }
      >
        <div className="tape" aria-hidden="true"></div>
        <div className="holes" aria-hidden="true">
          <i></i>
          <i></i>
          <i></i>
        </div>

        <section className="topic">
          <div className="sheet">
            {/* Top Academic Header Bar (Chapter X | Topic | Page no. X) */}
            <div className="academic-header-bar" role="banner">
              <span className="acad-chap">
                {note.chapter || (note.level && note.level.toLowerCase().includes("chapter") ? note.level : "Chapter 4")}
              </span>
              <span className="acad-topic">
                {note.shortTitle || note.subject || note.title || "Quadratic Equations"}
              </span>
              <span className="acad-page">
                {note.pageNo ? `Page no. ${note.pageNo}` : `Page no. ${85 + activePage + 1}`}
              </span>
            </div>

            {/* Problem / Example Banner or Standard Title */}
            {questionText ? (
              <div className="row">
                <div className="main">
                  <div className="example-prompt-banner">
                    {note.exampleNo && !questionText.startsWith("Example") && (
                      <span className="ex-prefix">Example {note.exampleNo}: </span>
                    )}
                    <MathText text={questionText} />
                  </div>
                </div>
              </div>
            ) : (
              activePage === 0 && (
                <>
                  <div className="row">
                    <div className="main">
                      <h1>{displayTitle}</h1>
                    </div>
                  </div>
                  <div className="row">
                    <div className="main">
                      <p className="meta">
                        {note.subject ? `${note.subject} · ` : ""}
                        {note.level && note.level !== "Study Notes" ? `${note.level} · ` : "Class 10 · "}
                        Page {activePage + 1}
                      </p>
                    </div>
                  </div>
                </>
              )
            )}

            {/* Content Blocks */}
            {contentBlocks.map((block, bIdx) => {
              switch (block.type) {
                case "heading": {
                  const margin = getNextMargin();
                  return (
                    <React.Fragment key={bIdx}>
                      {bIdx > 0 && <div className="gap"></div>}
                      <div className="row">
                        <div className="main">
                          <h2>{block.text}</h2>
                        </div>
                        {margin ? <div className="mn"><MathText text={margin} /></div> : null}
                      </div>
                    </React.Fragment>
                  );
                }

                case "para": {
                  const margin = getNextMargin();
                  return (
                    <React.Fragment key={bIdx}>
                      <div className="row">
                        <div className="main">
                          <p>
                            <MathText text={block.text} />
                          </p>
                        </div>
                        {margin ? <div className="mn"><MathText text={margin} /></div> : null}
                      </div>
                      {block.tex && (
                        <div className="row">
                          <div className="main">
                            <p className="eq">
                              <MathEq tex={block.tex} />
                            </p>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                }

                case "eq": {
                  const margin = getNextMargin();
                  return (
                    <div className="row" key={bIdx}>
                      <div className="main">
                        <p className="eq">
                          <MathEq tex={block.tex || block.text} />
                        </p>
                      </div>
                      {margin ? <div className="mn"><MathText text={margin} /></div> : null}
                    </div>
                  );
                }

                case "steps": {
                  return (
                    <React.Fragment key={bIdx}>
                      <div className="row">
                        <div className="main">
                          <div className="sol-badge-wrap">
                            <SolBadge />
                          </div>
                        </div>
                      </div>
                      {(block.items || []).map((stepItem: any, sIdx: number) => {
                        const margin = getNextMargin();
                        const texStr = stepItem.tex || stepItem.eq || "";
                        const isAlgebraLine =
                          stepItem.say &&
                          (stepItem.say.startsWith("Let") ||
                            stepItem.say.startsWith("Speed") ||
                            stepItem.say.startsWith("Time") ||
                            stepItem.say.startsWith("According") ||
                            stepItem.say.startsWith("Step"));
                        return (
                          <React.Fragment key={sIdx}>
                            <div className="row">
                              <div className="main">
                                <p className="step-line">
                                  {!isAlgebraLine && <b>Step {sIdx + 1}. </b>}
                                  <MathText text={stepItem.say} />
                                </p>
                              </div>
                              {margin ? <div className="mn"><MathText text={margin} /></div> : null}
                            </div>
                            {texStr && (
                              <div className="row">
                                <div className="main">
                                  <p className="eq">
                                    <MathEq tex={texStr} />
                                  </p>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                }

                case "answer": {
                  return (
                    <div className="row" key={bIdx}>
                      <div className="main">
                        <p className="eq">
                          <span className="box">
                            {block.tex ? <MathEq tex={block.tex} /> : <MathText text={block.text} />}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                }

                case "mistakes": {
                  return (
                    <div className="row" key={bIdx}>
                      <div className="main list red">
                        {(block.items || []).map((m: string, mIdx: number) => (
                          <p key={mIdx}>
                            ✗ <MathText text={m} />
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                }

                case "doodle": {
                  return (
                    <DoodleErrorBoundary key={bIdx} fallbackSpec={fallbackSpec}>
                      <Doodle spec={block.spec || fallbackSpec} />
                    </DoodleErrorBoundary>
                  );
                }

                case "example": {
                  return (
                    <React.Fragment key={bIdx}>
                      {bIdx > 0 && <div className="gap"></div>}
                      <div className="row">
                        <div className="main">
                          <h2>Worked example: {block.problem}</h2>
                        </div>
                      </div>
                      <div className="row">
                        <div className="main">
                          {Array.isArray(block.steps) &&
                            block.steps.map((st: any, exIdx: number) => {
                              const stepSay = typeof st === "string" ? st : st.say || st.step || "";
                              const stepTex = typeof st === "object" ? st.tex || st.eq || "" : "";
                              return (
                                <React.Fragment key={exIdx}>
                                  <p className="step">
                                    <b>Step {exIdx + 1}.</b>{" "}
                                    <MathText text={stepSay} />
                                  </p>
                                  {stepTex && (
                                    <p className="eq">
                                      <MathEq tex={stepTex} />
                                    </p>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          {block.answer && (
                            <p className="eq">
                              <span className="box">
                                <MathText text={block.answer} />
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                }

                case "summary": {
                  return (
                    <div className="row" key={bIdx}>
                      <div className="main">
                        <p>
                          {(block.items || []).map((item: string, sumIdx: number) => (
                            <span key={sumIdx}>
                              <span className="hg"><MathText text={item} /></span>
                              {sumIdx < (block.items?.length || 0) - 1 ? " · " : ""}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  );
                }

                case "practice": {
                  return (
                    <React.Fragment key={bIdx}>
                      {(block.items || []).map((pq: any, pIdx: number) => {
                        const margin = getNextMargin();
                        const isRevealed = revealedAnswers[pIdx];
                        return (
                          <div className="row" key={pIdx}>
                            <div className="main">
                              <p>
                                Q{pIdx + 1}. <MathText text={pq.q} /> &nbsp;
                                <button
                                  className="rev"
                                  type="button"
                                  onClick={() => toggleAnswer(pIdx)}
                                >
                                  {isRevealed ? "Hide answer" : "Show answer"}
                                </button>
                                {isRevealed && <span className="ans"> <MathText text={pq.a} /></span>}
                              </p>
                            </div>
                            {margin ? <div className="mn"><MathText text={margin} /></div> : null}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                }

                default:
                  return null;
              }
            })}

            {/* Rubber Stamp (Calculator verification) on the last page */}
            {activePage === totalPages - 1 && note.verified && (
              <>
                <div className="gap"></div>
                <div className="row">
                  <div className="main">
                    <span className="stamp">
                      {note.verifiedNote || "Checked by calculator: both equations hold ✓"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Pager */}
      {totalPages > 1 && (
        <div className="pager" role="navigation" aria-label="Sheets navigation">
          <button
            id="prev"
            type="button"
            disabled={activePage === 0}
            onClick={() => {
              setActivePage((prev) => Math.max(0, prev - 1));
              window.scrollTo(0, 0);
            }}
          >
            &larr; Previous page
          </button>
          <span id="plabel">
            Page {activePage + 1} of {totalPages}
          </span>
          <button
            id="next"
            type="button"
            disabled={activePage === totalPages - 1}
            onClick={() => {
              setActivePage((prev) => Math.min(totalPages - 1, prev + 1));
              window.scrollTo(0, 0);
            }}
          >
            Next page &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
