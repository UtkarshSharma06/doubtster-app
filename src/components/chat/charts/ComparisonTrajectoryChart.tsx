"use client";

import React from "react";

export function ComparisonTrajectoryChart() {
  return (
    <div className="fig" style={{ marginTop: "14px" }}>
      <div className="fh">
        <b>Flat ground vs cliff</b>
        <span>same kick (20 m/s @ 30°)</span>
      </div>

      <svg viewBox="0 0 700 230" style={{ width: "100%", height: "auto", display: "block" }}>
        {/* Cliff block */}
        <rect x="20" y="100" width="40" height="120" fill="#E9E4DA" />
        <line x1="20" x2="690" y1="220" y2="220" stroke="#C9C9D1" strokeWidth="1.5" />
        <line x1="60" x2="520" y1="100" y2="100" stroke="#C9C9D1" strokeDasharray="4 5" />

        {/* Flat ground trajectory (dashed blue) */}
        <path
          d="M60.0 100.0 Q 280 10 501.8 100.0"
          fill="none"
          stroke="#9DBFF5"
          strokeWidth="3"
          strokeDasharray="7 6"
        />

        {/* Cliff trajectory (solid green) */}
        <path
          d="M60.0 100.0 Q 280 10 501.8 100.0 T 661.0 220.0"
          fill="none"
          stroke="#1F9D55"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Landing markers */}
        <circle cx="501.8" cy="100" r="5" fill="#9DBFF5" />
        <circle cx="661.0" cy="220" r="6" fill="#1F9D55" stroke="#fff" strokeWidth="2" />

        <text x="509.8" y="92" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#5B85C8">
          flat: 35.3 m
        </text>
        <text
          x="655.0"
          y="208"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="#1F7A44"
          textAnchor="end"
        >
          cliff: 48.1 m (+12.8 m)
        </text>
        <text x="26" y="165" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#6E6E78">
          10 m
        </text>
      </svg>
    </div>
  );
}

