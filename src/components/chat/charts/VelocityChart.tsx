"use client";

import React from "react";

interface VelocityChartProps {
  v0: number;
  angleDeg: number;
  g?: number;
}

export function VelocityChart({ v0, angleDeg, g = 9.8 }: VelocityChartProps) {
  const rad = (angleDeg * Math.PI) / 180;
  const vx = v0 * Math.cos(rad);
  const vy = v0 * Math.sin(rad);
  const T = (2 * vy) / g;
  const tu = vy / g;

  const VW = 380;
  const VH = 250;
  const VP = { l: 44, r: 16, t: 16, b: 36 };
  const V = Math.ceil(Math.max(vx, vy) / 5) * 5 + 5;

  const vxs = (t: number) => VP.l + (t / T) * (VW - VP.l - VP.r);
  const vys = (vVal: number) => VP.t + (1 - (vVal + V) / (2 * V)) * (VH - VP.t - VP.b);

  // Time ticks
  const timeTicks = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0].filter((t) => t <= T + 0.05);

  // Position table rows
  const tableTimes: number[] = [];
  for (let t = 0; t < T - 0.05; t += 0.25) {
    tableTimes.push(+t.toFixed(2));
  }
  tableTimes.push(+tu.toFixed(2));
  tableTimes.push(+T.toFixed(2));
  const uniqueTimes = Array.from(new Set(tableTimes)).sort((a, b) => a - b);

  return (
    <div className="two">
      <div className="fig">
        <div className="fh">
          <b>Velocity vs time</b>
          <div className="legend">
            <span><i style={{ background: "#D9443A" }} />vᵧ</span>
            <span><i style={{ background: "#1F9D55" }} />vₓ</span>
          </div>
        </div>

        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
          {/* Y Axis Grid Lines */}
          {[-V, -10, 0, 10, V].map((val) => (
            <g key={`v-${val}`}>
              <line
                x1={VP.l}
                x2={VW - VP.r}
                y1={vys(val)}
                y2={vys(val)}
                stroke={val === 0 ? "#C9C9D1" : "#F0F0F3"}
                strokeWidth={val === 0 ? 1.5 : 1}
              />
              <text
                x={VP.l - 6}
                y={vys(val) + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="#6E6E78"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Time ticks */}
          {timeTicks.map((t) => (
            <text
              key={`t-${t}`}
              x={vxs(t)}
              y={VH - VP.b + 16}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="11"
              fill="#6E6E78"
            >
              {t}
            </text>
          ))}

          <text
            x={(VW + VP.l) / 2}
            y={VH - 4}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            fill="#4A4A53"
          >
            time t (s)
          </text>

          {/* Flat vx line */}
          <line
            x1={vxs(0)}
            x2={vxs(T)}
            y1={vys(vx)}
            y2={vys(vx)}
            stroke="#1F9D55"
            strokeWidth="3"
          />

          {/* Sloping vy line */}
          <line
            x1={vxs(0)}
            x2={vxs(T)}
            y1={vys(vy)}
            y2={vys(-vy)}
            stroke="#D9443A"
            strokeWidth="3"
          />

          {/* Apex Zero Crossing marker */}
          <line
            x1={vxs(tu)}
            x2={vxs(tu)}
            y1={VP.t}
            y2={VH - VP.b}
            stroke="#F5A623"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <circle cx={vxs(tu)} cy={vys(0)} r="5" fill="#F5A623" stroke="#fff" strokeWidth="2" />
          <text
            x={vxs(tu) + 8}
            y={vys(0) - 10}
            fill="#B07500"
            fontWeight="600"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11.5"
          >
            top · {tu.toFixed(2)} s
          </text>

          <text
            x={vxs(T) - 4}
            y={vys(vx) - 8}
            fill="#1F7A44"
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11.5"
          >
            vₓ = {vx.toFixed(1)}
          </text>
          <text
            x={vxs(0) + 6}
            y={vys(vy) - 6}
            fill="#B0322A"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11.5"
          >
            vᵧ = +{vy.toFixed(1)}
          </text>
          <text
            x={vxs(T) - 4}
            y={vys(-vy) + 16}
            fill="#B0322A"
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11.5"
          >
            −{vy.toFixed(1)}
          </text>
        </svg>

        <div className="cap">
          vᵧ falls in a straight line (slope = −g) and crosses zero exactly at the top. vₓ stays flat.
        </div>
      </div>

      <div className="fig">
        <div className="fh">
          <b>Position over time</b>
          <span>every 0.25 s</span>
        </div>
        <div style={{ maxHeight: "296px", overflow: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>t (s)</th>
                <th>x (m)</th>
                <th>y (m)</th>
                <th>vᵧ (m/s)</th>
              </tr>
            </thead>
            <tbody>
              {uniqueTimes.map((t) => {
                const x = vx * t;
                const y = Math.max(0, vy * t - 0.5 * g * t * t);
                const curVy = vy - g * t;
                const isTop = Math.abs(t - tu) < 0.006;
                const isEnd = Math.abs(t - T) < 0.006;

                return (
                  <tr key={t} className={isTop || isEnd ? "hl" : ""}>
                    <td>
                      {t.toFixed(2)}
                      {isTop && <small>top</small>}
                      {isEnd && <small>lands</small>}
                    </td>
                    <td>{x.toFixed(2)}</td>
                    <td>{y.toFixed(2)}</td>
                    <td>{Math.abs(curVy) < 0.005 ? "0.00" : curVy.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

