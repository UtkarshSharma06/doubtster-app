import React from "react";
import { compile } from "mathjs";

/* ---------- spec types (this is what the LLM outputs) ---------- */
export type Pt = { x: number; y?: number; label?: string; color?: "red" | "green" | "purple" | "ink" };
export type DoodleSpec =
  | { kind: "numberline"; min: number; max: number; step?: number; points: Pt[]; caption?: string }
  | { kind: "graph"; fn: string; xmin: number; xmax: number; ymin?: number; ymax?: number; points?: Pt[]; label?: string; fn2?: string; label2?: string; caption?: string }
  | { kind: "balance"; left: string; right: string; note?: string; caption?: string }
  | { kind: "flow"; nodes: string[]; caption?: string }
  | { kind: "concept"; center: string; parts: { label: string; note?: string }[]; caption?: string }
  | { kind: "boat"; distance?: string; speed?: string; caption?: string };

const W = 700, H = 260;
const col = (c?: string) => ({ red: "var(--red)", green: "var(--green)", purple: "var(--purple)", ink: "var(--ink)" } as any)[c || "ink"];
const T = (p: React.SVGProps<SVGTextElement> & { c?: string; s?: number }) => {
  const { c, s, ...r } = p;
  return <text {...r} fill={col(c)} style={{ fontFamily: "var(--pen)", fontSize: s || 26, fontWeight: 500 }} />;
};
const nice = (n: number) => (Math.abs(n) < 1e-9 ? "0" : String(+n.toFixed(2)));

function NumberLine({ s }: { s: Extract<DoodleSpec, { kind: "numberline" }> }) {
  const step = s.step || Math.max(1, Math.round((s.max - s.min) / 10));
  const x0 = 50, x1 = 640, sx = (v: number) => x0 + ((v - s.min) / (s.max - s.min)) * (x1 - x0), y = 150;
  const ticks: number[] = []; for (let v = s.min; v <= s.max + 1e-9; v += step) ticks.push(v);
  return (<>
    <path className="d" d={`M${x0 - 20} ${y} L${x1 + 30} ${y - 2} M${x1 + 10} ${y - 14} L${x1 + 32} ${y - 2} L${x1 + 10} ${y + 12}`} />
    {ticks.map((v) => (<g key={v}><path className="d" d={`M${sx(v)} ${y - 12}v24`} /><T x={sx(v) - 8} y={y + 46} s={24}>{nice(v)}</T></g>))}
    {s.points.map((p, i) => (<g key={i}>
      <circle className="d" cx={sx(p.x)} cy={y} r={12} fill={col(p.color || "red")} stroke={col(p.color || "red")} />
      <path className="d" stroke={col(p.color || "red")} d={`M${sx(p.x)} ${y - 100 + (i % 2) * 20}q-5 36 0 64m-12-14l12 18l12-18`} />
      {p.label && <T c={p.color || "red"} x={Math.min(Math.max(sx(p.x) - 90, 10), W - 200)} y={y - 108 + (i % 2) * 20}>{p.label}</T>}
    </g>))}
  </>);
}

function Graph({ s }: { s: Extract<DoodleSpec, { kind: "graph" }> }) {
  const f = compile(s.fn), g = s.fn2 ? compile(s.fn2) : null;
  const ev = (c: any, x: number) => { try { const v = c.evaluate({ x }); return typeof v === "number" && isFinite(v) ? v : NaN; } catch { return NaN; } };
  const N = 120, xs = Array.from({ length: N + 1 }, (_, i) => s.xmin + ((s.xmax - s.xmin) * i) / N);
  const ys = xs.map((x) => ev(f, x)).concat(g ? xs.map((x) => ev(g, x)) : []).filter((v) => !isNaN(v));
  let ymin = s.ymin ?? Math.min(...ys, 0), ymax = s.ymax ?? Math.max(...ys, 0);
  if (ymax - ymin < 1e-6) { ymax += 1; ymin -= 1; }
  const pad = (ymax - ymin) * 0.1; if (s.ymin === undefined) ymin -= pad; if (s.ymax === undefined) ymax += pad;
  const L = 70, R = 660, Tp = 20, B = 220;
  const sx = (x: number) => L + ((x - s.xmin) / (s.xmax - s.xmin)) * (R - L);
  const sy = (y: number) => B - ((y - ymin) / (ymax - ymin)) * (B - Tp);
  const path = (c: any) => { let d = "", pen = false; xs.forEach((x) => { const v = ev(c, x); if (isNaN(v) || v < ymin - (ymax - ymin) || v > ymax + (ymax - ymin)) { pen = false; return; } d += `${pen ? "L" : "M"}${sx(x).toFixed(1)} ${sy(v).toFixed(1)}`; pen = true; }); return d; };
  const ax0 = Math.min(Math.max(sx(0), L), R), ay0 = Math.min(Math.max(sy(0), Tp), B);
  const niceStep=(r:number,n:number)=>{const raw=r/n,m=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/m;return (f<1.5?1:f<3.5?2:f<7.5?5:10)*m;};
  const stepx = niceStep(s.xmax - s.xmin, 6), stepy = niceStep(ymax - ymin, 4);
  const xt: number[] = [], yt: number[] = [];
  for (let v = Math.ceil(s.xmin / stepx) * stepx; v <= s.xmax + 1e-9; v += stepx) if (Math.abs(v) > 1e-9) xt.push(v);
  for (let v = Math.ceil(ymin / stepy) * stepy; v <= ymax + 1e-9; v += stepy) if (Math.abs(v) > 1e-9) yt.push(v);
  return (<>
    <path className="d" d={`M${L} ${ay0} H${R + 10} M${ax0} ${B + 8} V${Tp - 8}`} />
    {xt.map((v) => { return <g key={"x" + v}><path className="d" d={`M${sx(v)} ${ay0 - 6}v12`} /><T x={sx(v) - 12} y={Math.min(ay0 + 30, B + 30)} s={20}>{nice(v)}</T></g>; })}
    {yt.map((v) => { return <g key={"y" + v}><path className="d" d={`M${ax0 - 6} ${sy(v)}h12`} /><T x={Math.max(ax0 - 50, 0)} y={sy(v) + 6} s={20}>{nice(v)}</T></g>; })}
    <path className="d r" d={path(f)} />
    {g && <path className="d g" d={path(g)} />}
    {s.label && <T c="red" x={L + 140} y={Tp + 14} s={24}>{s.label}</T>}
    {s.label2 && <T c="green" x={L + 140} y={Tp + 40} s={24}>{s.label2}</T>}
    {(s.points || []).map((p, i) => { const py = p.y ?? ev(f, p.x); return (<g key={i}>
      <circle className="d" cx={sx(p.x)} cy={sy(py)} r={8} fill={col(p.color || "purple")} stroke={col(p.color || "purple")} />
      {p.label && <T c={p.color || "purple"} x={Math.min(sx(p.x) + 14, W - 110)} y={sy(py) + 30} s={22}>{p.label}</T>}</g>); })}
  </>);
}

function Balance({ s }: { s: Extract<DoodleSpec, { kind: "balance" }> }) {
  return (<>
    <path className="d" d="M350 70 V200 M280 202 H420 M130 72 L570 70" />
    <circle className="d fy" cx="350" cy="66" r="9" />
    <path className="d" d="M130 72 L100 140 M130 72 L160 140 M100 140 Q130 164 160 140 M570 70 L540 138 M570 70 L600 138 M540 138 Q570 162 600 138" />
    <T x={Math.max(130 - s.left.length * 7, 20)} y={196}>{s.left}</T>
    <T x={Math.min(570 - s.right.length * 6, W - 20 - s.right.length * 12)} y={196}>{s.right}</T>
    <T c="red" x={300} y={40}>{s.note || "balanced"}</T>
  </>);
}

function Flow({ s }: { s: Extract<DoodleSpec, { kind: "flow" }> }) {
  const n = s.nodes.slice(0, 5), gap = 14, w = (W - 40 - gap * (n.length - 1)) / n.length;
  return (<>{n.map((t, i) => { const x = 20 + i * (w + gap); const words = t.split(" "); const lines: string[] = []; let cur = "";
    words.forEach((wd) => { if ((cur + " " + wd).trim().length > Math.max(7, w / 11)) { lines.push(cur); cur = wd; } else cur = (cur + " " + wd).trim(); }); lines.push(cur);
    return (<g key={i}>
      <rect className="d" x={x} y={70} width={w} height={120} rx={14} fill="none" stroke={col(i === n.length - 1 ? "red" : "ink")} />
      {lines.slice(0, 4).map((ln, j) => <T key={j} x={x + 10} y={104 + j * 28} s={22} c={i === n.length - 1 ? "red" : "ink"}>{ln}</T>)}
      {i < n.length - 1 && <path className="d" d={`M${x + w + 1} 130h${gap - 2}m-8-8l8 8l-8 8`} />}</g>); })}</>);
}

function Concept({ s }: { s: Extract<DoodleSpec, { kind: "concept" }> }) {
  const n = s.parts.slice(0, 6), cx = 350, cy = 125;
  return (<>
    <ellipse className="d fg" cx={cx} cy={cy} rx={100} ry={44} />
    <T c="green" x={cx - Math.min(s.center.length * 5.5, 85)} y={cy + 8}>{s.center.slice(0, 22)}</T>
    {n.map((p, i) => { const a = (-Math.PI / 2) + (i / n.length) * 2 * Math.PI + 0.45, ex = cx + Math.cos(a) * 250, ey = cy + Math.sin(a) * 100;
      const sx0 = cx + Math.cos(a) * 100, sy0 = cy + Math.sin(a) * 44; const left = ex < cx;
      return (<g key={i}><path className="d p" d={`M${sx0} ${sy0} L${ex - Math.cos(a) * 20} ${ey - Math.sin(a) * 12}`} />
        <T c="ink" x={left ? Math.max(ex - p.label.length * 6 - 10, 6) : Math.min(ex - 10, W - p.label.length * 12 - 10)} y={ey + 6} s={24}>{p.label}</T>
        {p.note && <T c="purple" x={left ? Math.max(ex - p.label.length * 6 - 10, 6) : Math.min(ex - 10, W - p.note.length * 9 - 10)} y={ey + 28} s={18}>{p.note}</T>}</g>); })}
  </>);
}

function BoatDoodle({ s }: { s: Extract<DoodleSpec, { kind: "boat" }> }) {
  const dist = s.distance || "24km";
  const speed = s.speed || "18km/h";
  return (
    <>
      {/* Downstream current flow arrows */}
      <path className="d" stroke="#1976D2" strokeWidth="2.5" d="M190 40 L210 52 M200 42 L210 52 L200 56" />
      <path className="d" stroke="#1976D2" strokeWidth="2.5" d="M145 75 L160 90 M152 79 L160 90 L149 92" />

      {/* Hand-drawn river wave lines (4 flowing wavy strokes) */}
      <path
        className="d"
        stroke="#1976D2"
        strokeWidth="2.8"
        d="M 170 38 C 150 55, 155 75, 175 92 C 195 108, 190 128, 215 145 C 240 162, 235 182, 260 200 C 285 218, 280 238, 305 252"
      />
      <path
        className="d"
        stroke="#1976D2"
        strokeWidth="2.8"
        d="M 150 55 C 130 72, 135 92, 155 109 C 175 125, 170 145, 195 162 C 220 179, 215 199, 240 217 C 265 235, 260 255, 285 269"
      />
      <path
        className="d"
        stroke="#1976D2"
        strokeWidth="2.8"
        d="M 130 72 C 110 89, 115 109, 135 126 C 155 142, 150 162, 175 179 C 200 196, 195 216, 220 234 C 245 252, 240 272, 265 286"
      />
      <path
        className="d"
        stroke="#1976D2"
        strokeWidth="2.8"
        d="M 110 89 C 90 106, 95 126, 115 143 C 135 159, 130 179, 155 196 C 180 213, 175 233, 200 251"
      />

      {/* Upstream distance label and arrow: 24km */}
      <path className="d" stroke="#1976D2" strokeWidth="2.2" d="M 270 115 L 246 95 M 246 95 L 258 96 M 246 95 L 250 107" />
      <T c="ink" x={232} y={80} s={24}>{dist}</T>

      {/* Hand-drawn Boat (angled along the stream) */}
      {/* Boat Hull */}
      <path
        className="d"
        stroke="#1976D2"
        strokeWidth="2.8"
        fill="rgba(25, 118, 210, 0.04)"
        d="M 264 135 L 302 145 L 290 156 L 256 145 Z"
      />
      {/* Mast & Triangular Sail */}
      <path
        className="d"
        stroke="#1976D2"
        strokeWidth="2.4"
        d="M 279 139 L 282 110 L 292 142"
      />

      {/* Speed arrow pointing right -> 18 km/h */}
      <path className="d" stroke="#1976D2" strokeWidth="2.4" d="M 315 142 L 348 142 M 340 136 L 348 142 L 340 148" />
      <T c="ink" x={358} y={148} s={24}>{speed}</T>
    </>
  );
}

export function Doodle({ spec }: { spec: DoodleSpec }) {
  return (
    <>
      <div className={`doodle ${spec.kind === "concept" ? "tall" : ""}`}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={spec.caption || spec.kind}>
          {spec.kind === "numberline" && <NumberLine s={spec} />}
          {spec.kind === "graph" && <Graph s={spec} />}
          {spec.kind === "balance" && <Balance s={spec} />}
          {spec.kind === "flow" && <Flow s={spec} />}
          {spec.kind === "concept" && <Concept s={spec} />}
          {spec.kind === "boat" && <BoatDoodle s={spec} />}
        </svg>
      </div>
      {spec.caption && (
        <div className="row">
          <div className="main">
            <p className="cap">{spec.caption}</p>
          </div>
        </div>
      )}
    </>
  );
}

/* Fallback: if the model returned no doodle, build one from the steps/answer so a page is never picture-less */
export function autoDoodle(opts: { answer?: string; steps?: string[]; fn?: string; title?: string }): DoodleSpec {
  const textCorpus = `${opts.title || ""} ${opts.answer || ""} ${(opts.steps || []).join(" ")}`.toLowerCase();
  if (
    textCorpus.includes("boat") ||
    textCorpus.includes("stream") ||
    textCorpus.includes("upstream") ||
    textCorpus.includes("downstream")
  ) {
    return {
      kind: "boat",
      distance: "24km",
      speed: "18km/h",
      caption: opts.title || "Upstream and downstream motion",
    };
  }
  const num = opts.answer && /^[^=]*=\s*(-?\d+(\.\d+)?)\s*$/.exec(opts.answer);
  if (opts.fn) return { kind: "graph", fn: opts.fn, xmin: -5, xmax: 5, caption: opts.title };
  if (num) { const v = parseFloat(num[1]); const span = Math.max(4, Math.ceil(Math.abs(v) * 1.6)); return { kind: "numberline", min: v < 0 ? -span : 0, max: v < 0 ? span / 2 : span, step: Math.max(1, Math.round(span / 6)), points: [{ x: v, label: opts.answer, color: "red" }], caption: "the answer on the number line" }; }
  return { kind: "flow", nodes: (opts.steps || ["Start", "Work", "Check", "Answer"]).slice(0, 5), caption: "the method at a glance" };
}
