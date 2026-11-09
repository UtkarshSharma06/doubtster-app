"use client";

import React from "react";
import katex from "katex";

export function MathFormula({ tex, inline = false }: { tex: string; inline?: boolean }) {
  try {
    const html = katex.renderToString(tex, {
      displayMode: !inline,
      throwOnError: false,
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span>{tex}</span>;
  }
}

export function EquationLine({ text }: { text: string }) {
  // If text contains an equation with result highlighting
  // e.g. "0 = vy - g*t -> t = 10 / 9.8 = 1.02 s"
  const parts = text.split("=");
  const hasResult = parts.length > 1;

  if (hasResult) {
    const mainPart = parts.slice(0, -1).join("=");
    const resPart = parts[parts.length - 1];

    return (
      <div className="eq">
        <span><MathFormula tex={mainPart.trim() + " ="} inline /> </span>
        <span className="res"><MathFormula tex={resPart.trim()} inline /></span>
      </div>
    );
  }

  return (
    <div className="eq">
      <MathFormula tex={text} inline />
    </div>
  );
}

