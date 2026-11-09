"use client";

import React from "react";

interface MakeActionsProps {
  onVideoClick?: () => void;
  onDeckClick?: () => void;
  onQuizClick?: () => void;
  stepNum?: number;
}

export function MakeActions({
  onVideoClick,
  onDeckClick,
  onQuizClick,
  stepNum = 9,
}: MakeActionsProps) {
  return (
    <section className="sec rv in" id="s-make">
      <div className="sh">
        <span className="n">{stepNum}</span>
        <h2>Turn this reply into</h2>
      </div>

      <div className="make">
        <button className="mk v" type="button" onClick={onVideoClick}>
          <span className="pr">2 credits</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M10 9l5 3-5 3z" fill="currentColor" />
          </svg>
          <b>Explainer video</b>
          <small>2 min, drawn on the board with voice</small>
        </button>

        <button className="mk f" type="button" onClick={onDeckClick}>
          <span className="pr">free</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <rect x="4" y="6" width="14" height="14" rx="2" />
            <path d="M8 3h12v14" />
          </svg>
          <b>Flashcards</b>
          <small>6 cards from this answer</small>
        </button>

        <button className="mk q" type="button" onClick={onQuizClick}>
          <span className="pr">free</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01" />
          </svg>
          <b>Practice quiz</b>
          <small>5 similar questions</small>
        </button>
      </div>
    </section>
  );
}

