"use client";

import React, { useState, useEffect, useRef } from "react";

interface TrajectoryChartProps {
  v0: number;
  angleDeg: number;
  g?: number;
  h0?: number;
  interactive?: boolean;
}

export function TrajectoryChart({
  v0: initV0,
  angleDeg: initAngle,
  g = 9.8,
  h0 = 0,
  interactive = true,
}: TrajectoryChartProps) {
  const [v, setV] = useState(initV0);
  const [ang, setAng] = useState(initAngle);
  const [hoverData, setHoverData] = useState<{
    t: number;
    x: number;
    y: number;
    vy: number;
    px: number;
    py: number;
  } | null>(null);

  const [ballPos, setBallPos] = useState<{ x: number; y: number; opacity: number }>({
    x: 0,
    y: 0,
    opacity: 0,
  });

  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  const W = 760;
  const H = 330;
  const P = { l: 56, r: 24, t: 26, b: 44 };

  // Calculate physics
  const rad = (ang * Math.PI) / 180;
  const vx = v * Math.cos(rad);
  const vy = v * Math.sin(rad);

  // Time to land: solve h0 + vy*t - 0.5*g*t^2 = 0
  const discr = vy * vy + 2 * g * h0;
  const T = (vy + Math.sqrt(Math.max(0, discr))) / g;
  const tu = vy / g;
  const maxH = h0 + (vy > 0 ? (vy * vy) / (2 * g) : 0);
  const R = vx * T;

  // Scale bounds
  const maxRangeEst = Math.max(R, (v * v) / g);
  const XM = Math.max(44, Math.ceil((maxRangeEst * 1.1) / 5) * 5);
  const YM = Math.max(20, Math.ceil((Math.max(maxH, 20) * 1.3) / 5) * 5);

  const sx = (x: number) => P.l + (x / XM) * (W - P.l - P.r);
  const sy = (y: number) => H - P.b - (y / YM) * (H - P.t - P.b);

  // Trajectory points
  const numPts = 90;
  const pts: [number, number][] = [];
  for (let i = 0; i <= numPts; i++) {
    const t = (T * i) / numPts;
    const x = vx * t;
    const y = Math.max(0, h0 + vy * t - 0.5 * g * t * t);
    pts.push([x, y]);
  }

  const pathD = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p[0]).toFixed(1)} ${sy(p[1]).toFixed(1)}`)
    .join(" ");

  const areaD = `${pathD} L${sx(R)} ${sy(0)} L${sx(0)} ${sy(0)} Z`;

  // Ghost path for initial values if modified
  const isModified = v !== initV0 || ang !== initAngle;
  let ghostD = "";
  if (isModified) {
    const r0 = (initAngle * Math.PI) / 180;
    const vx0 = initV0 * Math.cos(r0);
    const vy0 = initV0 * Math.sin(r0);
    const T0 = (vy0 + Math.sqrt(Math.max(0, vy0 * vy0 + 2 * g * h0))) / g;
    const gPts: [number, number][] = [];
    for (let i = 0; i <= 60; i++) {
      const t = (T0 * i) / 60;
      gPts.push([vx0 * t, Math.max(0, h0 + vy0 * t - 0.5 * g * t * t)]);
    }
    ghostD = gPts
      .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p[0]).toFixed(1)} ${sy(p[1]).toFixed(1)}`)
      .join(" ");
  }

  // Animation loop for projectile ball
  useEffect(() => {
    startTimeRef.current = performance.now();
    const duration = Math.max(1400, T * 900);

    const animate = (now: number) => {
      const elapsed = (now - startTimeRef.current) % (duration + 600);
      const frac = elapsed / duration;

      if (frac <= 1) {
        const curT = T * frac;
        const curX = vx * curT;
        const curY = Math.max(0, h0 + vy * curT - 0.5 * g * curT * curT);
        setBallPos({ x: sx(curX), y: sy(curY), opacity: 1 });
      } else {
        setBallPos((prev) => ({ ...prev, opacity: 0 }));
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [v, ang, T, vx, vy, h0, g]);

  // Handle hover readout
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const currX = ((mx - P.l) / (W - P.l - P.r)) * XM;

    if (currX < 0 || currX > R) {
      setHoverData(null);
      return;
    }

    const t = currX / vx;
    const y = Math.max(0, h0 + vy * t - 0.5 * g * t * t);
    const currentVy = vy - g * t;

    setHoverData({
      t,
      x: currX,
      y,
      vy: currentVy,
      px: sx(currX),
      py: sy(y),
    });
  };

  const apexX = tu > 0 ? sx(vx * tu) : sx(0);
  const apexY = sy(maxH);

  // Grid steps
  const stx = XM > 70 ? 10 : 5;
  const sty = YM > 30 ? 10 : 5;

  return (
    <div className="fig figwrap">
      <div className="fh">
        <b>Trajectory: height vs distance</b>
        <div className="legend">
          <span><i style={{ background: "#2F7BFF" }} />path</span>
          <span><i style={{ background: "#F5A623" }} />max height</span>
          <span><i style={{ background: "#1F9D55" }} />range</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverData(null)}
      >
        <g stroke="#F0F0F3">
          {/* Vertical grid lines */}
          {Array.from({ length: Math.floor(XM / stx) + 1 }).map((_, i) => {
            const xVal = i * stx;
            return (
              <g key={`x-${xVal}`}>
                <line x1={sx(xVal)} x2={sx(xVal)} y1={P.t} y2={H - P.b} stroke="#F0F0F3" />
                <text
                  x={sx(xVal)}
                  y={H - P.b + 18}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="12"
                  fill="#6E6E78"
                >
                  {xVal}
                </text>
              </g>
            );
          })}

          {/* Horizontal grid lines */}
          {Array.from({ length: Math.floor(YM / sty) + 1 }).map((_, i) => {
            const yVal = i * sty;
            return (
              <g key={`y-${yVal}`}>
                <line x1={P.l} x2={W - P.r} y1={sy(yVal)} y2={sy(yVal)} stroke="#F0F0F3" />
                <text
                  x={P.l - 8}
                  y={sy(yVal) + 4}
                  textAnchor="end"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="12"
                  fill="#6E6E78"
                >
                  {yVal}
                </text>
              </g>
            );
          })}
        </g>

        {/* Axes */}
        <line x1={P.l} x2={W - P.r} y1={sy(0)} y2={sy(0)} stroke="#C9C9D1" strokeWidth="1.5" />
        <text
          x={(W + P.l) / 2}
          y={H - 6}
          textAnchor="middle"
          fill="#4A4A53"
          fontFamily="Inter, sans-serif"
          fontSize="12.5"
        >
          horizontal distance x (m)
        </text>
        <text
          x={16}
          y={(H - P.b + P.t) / 2}
          textAnchor="middle"
          fill="#4A4A53"
          fontFamily="Inter, sans-serif"
          fontSize="12.5"
          transform={`rotate(-90 16 ${(H - P.b + P.t) / 2})`}
        >
          height y (m)
        </text>

        {/* Cliff rectangle if h0 > 0 */}
        {h0 > 0 && (
          <rect
            x={P.l - 24}
            y={sy(h0)}
            width={24}
            height={sy(0) - sy(h0)}
            fill="#E9E4DA"
            stroke="#C9C9CF"
          />
        )}

        {/* Ghost curve if modified */}
        {isModified && ghostD && (
          <path d={ghostD} fill="none" stroke="#C9DAF8" strokeWidth="2" strokeDasharray="5 6" />
        )}

        {/* Shaded Area & Trajectory Curve */}
        <path d={areaD} fill="rgba(47,123,255,.07)" />
        <path d={pathD} fill="none" stroke="#2F7BFF" strokeWidth="3.5" strokeLinecap="round" />

        {/* Apex Height marker */}
        {tu > 0 && (
          <>
            <line
              x1={apexX}
              x2={apexX}
              y1={apexY}
              y2={sy(0)}
              stroke="#F5A623"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <circle cx={apexX} cy={apexY} r="6" fill="#F5A623" stroke="#fff" strokeWidth="2" />
            <text
              x={apexX + 10}
              y={Math.max(P.t + 12, apexY - 10)}
              fill="#B07500"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
              fontSize="12"
            >
              H = {maxH.toFixed(2)} m
            </text>
          </>
        )}

        {/* Landing Range marker */}
        <circle cx={sx(R)} cy={sy(0)} r="6" fill="#1F9D55" stroke="#fff" strokeWidth="2" />
        <text
          x={sx(R) - 4}
          y={sy(0) - 12}
          textAnchor="end"
          fill="#1F7A44"
          fontWeight="600"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
        >
          R = {R.toFixed(1)} m
        </text>

        {/* Range underline */}
        <line
          x1={sx(0)}
          x2={sx(R)}
          y1={sy(0) + 12}
          y2={sy(0) + 12}
          stroke="#1F9D55"
          strokeWidth="2"
        />

        {/* Animated Projectile Ball */}
        <circle
          cx={ballPos.x}
          cy={ballPos.y}
          r="7"
          fill="#0B0B0F"
          opacity={ballPos.opacity}
        />

        {/* Hover Crosshairs & Point */}
        {hoverData && (
          <g>
            <line
              x1={hoverData.px}
              x2={hoverData.px}
              y1={hoverData.py}
              y2={sy(0)}
              stroke="#2F7BFF"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={hoverData.px}
              cy={hoverData.py}
              r="5"
              fill="#fff"
              stroke="#2F7BFF"
              strokeWidth="2.5"
            />
          </g>
        )}
      </svg>

      {/* Floating Readout Tooltip */}
      {hoverData && (
        <div
          className="tip"
          style={{
            position: "absolute",
            left: `${Math.min(W - 140, hoverData.px + 12)}px`,
            top: `${hoverData.py - 60}px`,
            opacity: 1,
            pointerEvents: "none",
          }}
        >
          t = {hoverData.t.toFixed(2)} s<br />
          x = {hoverData.x.toFixed(1)} m<br />
          y = {hoverData.y.toFixed(2)} m<br />
          vᵧ = {hoverData.vy.toFixed(1)} m/s
        </div>
      )}

      {/* Interactive Controls */}
      {interactive && (
        <div className="ctrl">
          <label>
            angle θ{" "}
            <input
              type="range"
              min="10"
              max="80"
              step="1"
              value={ang}
              onChange={(e) => setAng(+e.target.value)}
            />
            <output>{ang}°</output>
          </label>

          <label>
            speed{" "}
            <input
              type="range"
              min="10"
              max="35"
              step="1"
              value={v}
              onChange={(e) => setV(+e.target.value)}
            />
            <output>{v} m/s</output>
          </label>

          <span className={`tag45 ${ang === 45 ? "show" : ""}`}>
            45° gives the longest range
          </span>

          <span className="ro">
            H <b>{maxH.toFixed(2)}</b> m · T <b>{T.toFixed(2)}</b> s · R <b>{R.toFixed(1)}</b> m
          </span>
        </div>
      )}
    </div>
  );
}

