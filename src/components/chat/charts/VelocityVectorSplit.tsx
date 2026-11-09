"use client";

import React from "react";

export function VelocityVectorSplit() {
  return (
    <div className="fig">
      <div className="fh">
        <b>Velocity components</b>
        <span>fig. 1</span>
      </div>

      <svg
        viewBox="0 0 360 220"
        aria-label="Velocity vector split into horizontal and vertical components"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <defs>
          <marker id="ah-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="#2F7BFF" />
          </marker>
          <marker id="ah-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="#1F9D55" />
          </marker>
          <marker id="ah-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="#D9443A" />
          </marker>
        </defs>

        <line x1="40" y1="180" x2="330" y2="180" stroke="#E4E4E9" strokeWidth="2" />
        {/* vx green */}
        <line x1="50" y1="180" x2="279" y2="180" stroke="#1F9D55" strokeWidth="3.5" markerEnd="url(#ah-green)" />
        {/* vy red dashed */}
        <line x1="285" y1="180" x2="285" y2="54" stroke="#D9443A" strokeWidth="3.5" strokeDasharray="6 6" markerEnd="url(#ah-red)" />
        {/* v0 blue */}
        <line x1="50" y1="180" x2="279" y2="54" stroke="#2F7BFF" strokeWidth="4" markerEnd="url(#ah-blue)" />

        {/* 30° Arc */}
        <path d="M95 180 A45 45 0 0 0 89.4 158.7" fill="none" stroke="#0B0B0F" strokeWidth="1.6" />
        <text x="102" y="171" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#0B0B0F">
          30°
        </text>

        <text
          x="130"
          y="104"
          fontFamily="Inter, sans-serif"
          fontWeight="600"
          fontSize="14"
          fill="#2F7BFF"
          transform="rotate(-29 130 104)"
        >
          v₀ = 20 m/s
        </text>
        <text x="122" y="203" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#1F9D55">
          vₓ = 17.32 m/s
        </text>
        <text x="296" y="122" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#D9443A">
          vᵧ
        </text>
        <text x="296" y="140" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#D9443A">
          10 m/s
        </text>
      </svg>

      <div className="cap">
        The blue arrow is the kick. Green is how fast it moves sideways, red is how fast it rises.
      </div>
    </div>
  );
}

