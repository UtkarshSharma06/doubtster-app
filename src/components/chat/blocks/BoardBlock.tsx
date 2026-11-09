import React from "react";

interface BoardBlockProps {
  lines: string[];
  stepNum?: number;
}

export function BoardBlock({ lines, stepNum = 7 }: BoardBlockProps) {
  if (!lines || lines.length === 0) return null;

  return (
    <section className="sec rv in" id="s-sum">
      <div className="sh">
        <span className="n">{stepNum}</span>
        <h2>On the board</h2>
        <small>copy this into your notes</small>
      </div>

      <div className="board">
        {lines.map((line, idx) => {
          // Format highlighted numbers or keywords wrapped in yellow
          const parts = line.split(/(\d+(?:\.\d+)?\s*(?:m\/s|m|s)?)/);
          return (
            <div key={idx} style={{ marginBottom: "4px" }}>
              {parts.map((p, pIdx) => {
                const isHighlight = /\d/.test(p);
                return isHighlight ? (
                  <span key={pIdx} className="y">
                    {p}
                  </span>
                ) : (
                  <span key={pIdx}>{p}</span>
                );
              })}
            </div>
          );
        })}

        <div className="chalk">
          <i />
          <i />
          <i />
        </div>
      </div>
    </section>
  );
}

