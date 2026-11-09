"use client";

import React from "react";

interface RefChipProps {
  stepId?: string;
  label?: string;
  onClick?: () => void;
}

export function RefChip({ stepId, label, onClick }: RefChipProps) {
  if (!label && !stepId) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
      return;
    }

    if (stepId) {
      const target = document.getElementById(stepId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        if (target.tagName === "LI") {
          target.classList.add("hl");
          setTimeout(() => target.classList.remove("hl"), 2000);
        } else {
          target.classList.remove("flash");
          void target.offsetWidth;
          target.classList.add("flash");
        }
      }
    }
  };

  return (
    <button className="ref" type="button" onClick={handleClick}>
      {label || `↑ about step ${stepId}`}
    </button>
  );
}

