"use client";

import React from "react";

interface AnalogyChartProps {
  leftTitle?: string;
  leftDesc?: string;
  rightTitle?: string;
  rightDesc?: string;
}

export function AnalogyChart({
  leftTitle = "Torch from above",
  leftDesc = "moves the same distance every second → vₓ",
  rightTitle = "Torch from the side",
  rightDesc = "goes up, slows, stops, falls back → vᵧ",
}: AnalogyChartProps) {
  return (
    <div className="analogy" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
      {/* Left shadow: floor */}
      <div className="fig" style={{ margin: 0 }}>
        <div className="fh">
          <b>{leftTitle}</b>
          <span>shadow on the floor</span>
        </div>
        <svg viewBox="0 0 320 130" style={{ width: "100%", height: "auto", display: "block" }}>
          <line x1="20" x2="300" y1="110" y2="110" stroke="#C9C9D1" strokeWidth="1.5" />
          <g fill="#1F9D55">
            <circle cx="40" cy="110" r="5" opacity="0.3" />
            <circle cx="105" cy="110" r="5" opacity="0.5" />
            <circle cx="170" cy="110" r="5" opacity="0.7" />
            <circle cx="235" cy="110" r="5" opacity="0.85" />
            <circle cx="300" cy="110" r="5" />
          </g>
          <text x="20" y="38" fontFamily="Inter, sans-serif" fontSize="13" fill="#3E3E46">
            moves the same distance
          </text>
          <text x="20" y="56" fontFamily="Inter, sans-serif" fontSize="13" fill="#3E3E46">
            every second → <tspan fontWeight="700" fill="#1F7A44">vₓ</tspan>
          </text>
        </svg>
      </div>

      {/* Right shadow: wall */}
      <div className="fig" style={{ margin: 0 }}>
        <div className="fh">
          <b>{rightTitle}</b>
          <span>shadow on a wall</span>
        </div>
        <svg viewBox="0 0 320 130" style={{ width: "100%", height: "auto", display: "block" }}>
          <line x1="160" x2="160" y1="10" y2="120" stroke="#C9C9D1" strokeWidth="1.5" />
          <g fill="#D9443A">
            <circle cx="160" cy="115" r="5" opacity="0.3" />
            <circle cx="160" cy="62" r="5" opacity="0.55" />
            <circle cx="160" cy="35" r="5" />
            <circle cx="160" cy="62" r="5" opacity="0.55" />
          </g>
          <text x="180" y="42" fontFamily="Inter, sans-serif" fontSize="13" fill="#3E3E46">
            goes up, slows,
          </text>
          <text x="180" y="60" fontFamily="Inter, sans-serif" fontSize="13" fill="#3E3E46">
            stops, falls back
          </text>
          <text x="180" y="78" fontFamily="Inter, sans-serif" fontSize="13" fill="#3E3E46">
            → <tspan fontWeight="700" fill="#B0322A">vᵧ</tspan>
          </text>
        </svg>
      </div>
    </div>
  );
}

