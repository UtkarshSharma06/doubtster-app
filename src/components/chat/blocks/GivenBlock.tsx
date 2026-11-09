import React from "react";

interface GivenBlockProps {
  items: { label: string; value: string }[];
  assumptions?: string[];
  stepNum?: number;
}

export function GivenBlock({ items, assumptions, stepNum = 1 }: GivenBlockProps) {
  return (
    <section className="sec rv in" id="s-given">
      <div className="sh">
        <span className="n">{stepNum}</span>
        <h2>What we know</h2>
        <small>read the question twice</small>
      </div>

      <div className="giv">
        {items.map((item, idx) => (
          <div className="gv" key={idx}>
            <small>{item.label}</small>
            <div>{item.value}</div>
          </div>
        ))}
      </div>

      {assumptions && assumptions.length > 0 && (
        <div className="assume">
          {assumptions.map((asm, idx) => (
            <span key={idx}>{asm}</span>
          ))}
        </div>
      )}
    </section>
  );
}

