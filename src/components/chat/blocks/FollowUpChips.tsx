"use client";

import React from "react";

interface FollowUpChipsProps {
  chips: string[];
  onSelect: (chip: string) => void;
}

export function FollowUpChips({ chips, onSelect }: FollowUpChipsProps) {
  if (!chips || chips.length === 0) return null;

  return (
    <div style={{ marginTop: "16px" }}>
      <div className="sh" style={{ marginBottom: "8px" }}>
        <h2 style={{ fontSize: "16.5px", fontWeight: 600 }}>Ask next</h2>
      </div>
      <div className="fups">
        {chips.map((chip, idx) => (
          <button key={idx} type="button" onClick={() => onSelect(chip)}>
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

