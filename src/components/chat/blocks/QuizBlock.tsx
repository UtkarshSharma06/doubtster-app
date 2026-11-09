"use client";

import React, { useState } from "react";
import { QuizItem } from "@/lib/chat/schema";

interface QuizBlockProps {
  quiz: QuizItem[];
  stepNum?: number;
}

export function QuizBlock({ quiz, stepNum = 8 }: QuizBlockProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  if (!quiz || quiz.length === 0) return null;

  const handleSelect = (qIdx: number, optIdx: number) => {
    if (selectedAnswers[qIdx] !== undefined) return; // answered already
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  return (
    <section className="sec rv in" id="s-quiz">
      <div className="sh">
        <span className="n">{stepNum}</span>
        <h2>Check yourself</h2>
        <small>{quiz.length} quick {quiz.length === 1 ? "question" : "questions"}</small>
      </div>

      {quiz.map((qItem, qIdx) => {
        const chosen = selectedAnswers[qIdx];
        const isAnswered = chosen !== undefined;

        return (
          <div className="qz" key={qIdx}>
            <p>{qItem.q}</p>
            <div className="opts">
              {qItem.options.map((opt, optIdx) => {
                let btnClass = "";
                if (isAnswered) {
                  if (optIdx === qItem.answer) {
                    btnClass = "right";
                  } else if (optIdx === chosen) {
                    btnClass = "wrong";
                  }
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    className={btnClass}
                    onClick={() => handleSelect(qIdx, optIdx)}
                    disabled={isAnswered}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="fb show" style={{ marginTop: "10px" }}>
                {qItem.why}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

