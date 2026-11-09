"use client";

import React from "react";
import { EquationLine } from "./EquationBlock";

export interface StepItem {
  id: string;
  title: string;
  why: string;
  math?: string[];
  result?: string;
  note?: string;
  deeper?: string;
}

interface StepsBlockProps {
  steps: StepItem[];
  stepNum?: number;
}

export function StepsBlock({ steps, stepNum = 3 }: StepsBlockProps) {
  return (
    <section className="sec rv in" id="s-steps">
      <div className="sh">
        <span className="n">{stepNum}</span>
        <h2>Solve it, step by step</h2>
        <small>tap a step to see why</small>
      </div>

      <ol className="steps">
        {steps.map((st, idx) => (
          <li className="st" key={st.id || idx} id={st.id || `step-${idx + 1}`}>
            <span className="k">{idx + 1}</span>
            <div className="card">
              <h3>{st.title}</h3>
              <p className="why">{st.why}</p>

              {st.math && st.math.map((eq, eqIdx) => (
                <EquationLine key={eqIdx} text={eq} />
              ))}

              {st.note && (
                <div className="note">{st.note}</div>
              )}

              {st.deeper && (
                <details className="deep">
                  <summary>why is this step taken?</summary>
                  <p>{st.deeper}</p>
                </details>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

