"use client";

import React, { useState } from "react";
import { Answer } from "@/lib/chat/schema";
import { ModeTabs, ViewMode } from "./ModeTabs";
import { SummaryTiles } from "./blocks/SummaryTiles";
import { GivenBlock } from "./blocks/GivenBlock";
import { StepsBlock } from "./blocks/StepsBlock";
import { FigureBlock } from "./blocks/FigureBlock";
import { TableBlock } from "./blocks/TableBlock";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { BoardBlock } from "./blocks/BoardBlock";
import { QuizBlock } from "./blocks/QuizBlock";
import { MakeActions } from "./blocks/MakeActions";
import { FollowUpChips } from "./blocks/FollowUpChips";
import { VelocityVectorSplit } from "./charts/VelocityVectorSplit";
import { VelocityChart } from "./charts/VelocityChart";

interface AnswerCardProps {
  answer: Answer;
  onFollowUpClick?: (text: string) => void;
  onMakeVideo?: () => void;
  onMakeDeck?: () => void;
  onMakeQuiz?: () => void;
}

export function AnswerCard({
  answer,
  onFollowUpClick,
  onMakeVideo,
  onMakeDeck,
  onMakeQuiz,
}: AnswerCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("steps");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const givenBlock = answer.blocks.find((b) => b.type === "given") as any;
  const stepsBlock = answer.blocks.find((b) => b.type === "steps") as any;
  const figureBlock = answer.blocks.find((b) => b.type === "figure") as any;
  const tableBlock = answer.blocks.find((b) => b.type === "table") as any;
  const calloutBlocks = answer.blocks.filter((b) => b.type === "callout") as any[];

  // Determine physics projectile problem details
  const isProjectile =
    answer.topic.toLowerCase().includes("projectile") ||
    answer.title.toLowerCase().includes("projectile");

  const stepCount = stepsBlock?.steps?.length || 4;

  const handleCopy = () => {
    const textToCopy = `${answer.title}\n\n${answer.summary}\n\nResults:\n${answer.result
      .map((r) => `${r.label}: ${r.value} ${r.unit || ""}`)
      .join("\n")}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <article className="win" id="card1">
      {/* Mac Window Titlebar */}
      <div className="tb">
        <i />
        <i />
        <i />
        <em>answer.md</em>
        <span>{stepCount} steps · 4 min read</span>
      </div>

      <div className="ab">
        {/* Subject and Topic Chips */}
        <div className="meta">
          <span className="chip sub">{answer.subject || "Physics"}</span>
          <span className="chip">{answer.topic || "Kinematics"}</span>
          <span className="chip lvl">
            <i />
            {answer.level || "Grade 11 to 12"}
          </span>
        </div>

        {/* Answer Title & Lead Idea */}
        <h1 className="at">{answer.title}</h1>
        <p className="lead">{answer.summary}</p>

        {/* View Mode Tabs */}
        <ModeTabs mode={viewMode} onChange={setViewMode} />

        {/* Results Tiles */}
        <SummaryTiles tiles={answer.result} />

        {/* QUICK VIEW MODE */}
        {viewMode === "quick" && (
          <div style={{ marginTop: "24px" }}>
            <div className="sec rv in">
              <div className="sh">
                <h2>Quick Summary</h2>
              </div>
              <p className="tx">
                1. <b>Split velocity:</b> vₓ = 17.32 m/s (horizontal, steady), vᵧ = 10.0 m/s (vertical, drops by 9.8 m/s²).
              </p>
              <p className="tx">
                2. <b>Air time:</b> Reaches peak at 1.02 s (where vᵧ = 0), so total symmetric air time is <b>2.04 s</b>.
              </p>
              <p className="tx">
                3. <b>Range:</b> Distance = vₓ × T = 17.32 × 2.04 = <b>35.3 m</b>.
              </p>
            </div>
            {answer.board && <BoardBlock lines={answer.board} stepNum={2} />}
          </div>
        )}

        {/* EXPLAIN LIKE I'M 12 VIEW MODE */}
        {viewMode === "eli12" && (
          <div style={{ marginTop: "24px" }}>
            <div className="sec rv in">
              <div className="sh">
                <h2>Simple Analogy</h2>
              </div>
              <p className="tx">
                Imagine two separate balls:
              </p>
              <p className="tx">
                - Ball 1 rolls sideways on smooth ice at <b>17.32 meters every second</b>. Nothing stops it.
              </p>
              <p className="tx">
                - Ball 2 is thrown straight up into the air at <b>10 meters per second</b>. Gravity slows it down, it stops at the top after 1 second, then falls back down for 1 second (total 2 seconds).
              </p>
              <p className="tx">
                Your kicked ball is simply doing both at the same time! While it spends 2 seconds in the air rising and falling, it has also traveled <b>35.3 meters</b> sideways.
              </p>
            </div>
          </div>
        )}

        {/* FULL STEPS VIEW MODE */}
        {viewMode === "steps" && (
          <>
            {/* 1. What We Know (Given) */}
            {givenBlock && (
              <GivenBlock
                items={givenBlock.items}
                assumptions={givenBlock.assumptions}
                stepNum={1}
              />
            )}

            {/* 2. Velocity Split Section for Projectile Motion */}
            {isProjectile && (
              <section className="sec rv in" id="s-split">
                <div className="sh">
                  <span className="n">2</span>
                  <h2>Split the velocity</h2>
                  <small>the step everything else depends on</small>
                </div>
                <div className="two">
                  <VelocityVectorSplit />
                  <div>
                    <p className="tx">Use the angle to split <b>v₀</b> into two independent motions:</p>
                    <div className="eq">
                      vₓ = v₀ cos θ = 20 × cos 30° = <span className="res">17.32 m/s</span>
                    </div>
                    <div className="eq">
                      vᵧ = v₀ sin θ = 20 × sin 30° = <span className="res">10.0 m/s</span>
                    </div>
                    <p className="tx" style={{ marginTop: "12px" }}>
                      <b>vₓ never changes</b> (nothing pushes sideways). <b>vᵧ drops by 9.8 m/s every second</b> because of gravity.
                    </p>
                    <div className="note" style={{ fontFamily: "Caveat, cursive", fontSize: "22px", color: "var(--blue)", marginTop: "8px" }}>
                      cos goes with the side touching the angle ✓
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Steps Block */}
            {stepsBlock && (
              <StepsBlock steps={stepsBlock.steps} stepNum={isProjectile ? 3 : 2} />
            )}

            {/* 4. Figure Block (Interactive SVG Trajectory Chart) */}
            {figureBlock && (
              <FigureBlock
                id={figureBlock.id}
                title={figureBlock.title}
                caption={figureBlock.caption}
                chart={figureBlock.chart}
                stepNum={isProjectile ? 4 : 3}
              />
            )}

            {/* 5. Speed over time (Velocity Graph & Position Table) */}
            {isProjectile && (
              <section className="sec rv in" id="s-vel">
                <div className="sh">
                  <span className="n">5</span>
                  <h2>How the speed changes</h2>
                  <small>the key insight</small>
                </div>
                <VelocityChart v0={20} angleDeg={30} g={9.8} />
              </section>
            )}

            {/* Table Block if custom data */}
            {tableBlock && (
              <TableBlock
                title={tableBlock.title}
                columns={tableBlock.columns}
                rows={tableBlock.rows}
                highlightRows={tableBlock.highlightRows}
              />
            )}

            {/* 6. Mistakes and Sanity Checks */}
            {(calloutBlocks.length > 0 || answer.mistakes || answer.checks) && (
              <section className="sec rv in" id="s-mist">
                <div className="sh">
                  <span className="n">{isProjectile ? 6 : 4}</span>
                  <h2>Common mistakes</h2>
                  <small>where marks are lost</small>
                </div>

                {calloutBlocks.map((c, i) => (
                  <CalloutBlock key={i} tone={c.tone} title={c.title} items={c.items} />
                ))}

                {answer.mistakes && answer.mistakes.length > 0 && calloutBlocks.length === 0 && (
                  <CalloutBlock
                    tone="warn"
                    title="Watch out for these"
                    items={answer.mistakes}
                  />
                )}

                {answer.checks && answer.checks.length > 0 && calloutBlocks.length === 0 && (
                  <CalloutBlock
                    tone="ok"
                    title="Quick sanity checks"
                    items={answer.checks}
                  />
                )}
              </section>
            )}

            {/* 7. Chalkboard Summary */}
            {answer.board && (
              <BoardBlock lines={answer.board} stepNum={isProjectile ? 7 : 5} />
            )}

            {/* 8. Quiz Block */}
            {answer.quiz && answer.quiz.length > 0 && (
              <QuizBlock quiz={answer.quiz} stepNum={isProjectile ? 8 : 6} />
            )}
          </>
        )}

        {/* 9. Action Cards (Explainer Video, Flashcards, Practice Quiz) */}
        {answer.offerVideo && (
          <MakeActions
            onVideoClick={onMakeVideo}
            onDeckClick={onMakeDeck}
            onQuizClick={onMakeQuiz}
            stepNum={isProjectile ? 9 : 7}
          />
        )}

        {/* Suggested Next Questions */}
        {answer.followUps && answer.followUps.length > 0 && (
          <FollowUpChips
            chips={answer.followUps}
            onSelect={(chip) => onFollowUpClick?.(chip)}
          />
        )}

        {/* Footer */}
        <div className="foot">
          <span>
            Checked with two methods · AI answers can contain mistakes. Check important ones with your teacher.
          </span>
          <div className="acts">
            <button type="button" onClick={handleCopy}>
              {copied ? "copied" : "copy"}
            </button>
            <button type="button" onClick={handleSave}>
              {saved ? "saved!" : "save to notes"}
            </button>
            <button type="button" aria-label="Helpful">👍</button>
            <button type="button" aria-label="Not helpful">👎</button>
          </div>
        </div>
      </div>
    </article>
  );
}

