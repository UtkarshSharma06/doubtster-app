"use client";

import React from "react";

export type ViewMode = "steps" | "quick" | "eli12";

interface ModeTabsProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ModeTabs({ mode, onChange }: ModeTabsProps) {
  return (
    <div className="modes" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "steps"}
        className={mode === "steps" ? "on" : ""}
        onClick={() => onChange("steps")}
      >
        Steps
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "quick"}
        className={mode === "quick" ? "on" : ""}
        onClick={() => onChange("quick")}
      >
        Quick
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "eli12"}
        className={mode === "eli12" ? "on" : ""}
        onClick={() => onChange("eli12")}
      >
        Explain like I&apos;m 12
      </button>
    </div>
  );
}

