import React from "react";

interface CalloutBlockProps {
  tone: "warn" | "ok" | "info";
  title: string;
  items: string[];
}

export function CalloutBlock({ tone, title, items }: CalloutBlockProps) {
  const icon = tone === "warn" ? "!" : tone === "ok" ? "✓" : "i";

  return (
    <div className={`callout ${tone}`} style={{ marginTop: "12px" }}>
      <span className="ic">{icon}</span>
      <div>
        <h4>{title}</h4>
        <ul>
          {items.map((it, idx) => (
            <li key={idx}>{it}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

