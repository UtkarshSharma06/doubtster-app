"use client";
import { useEffect, type RefObject } from "react";

type Opts = {
  hero: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLElement | null>;
  dots: RefObject<HTMLElement | null>;
  /** Vertical reference for the parallax. "mid" uses the stage's own height. */
  originY?: number | "mid";
  /** Divider for the vertical parallax. Defaults to 700. "mid" uses stage height. */
  spanY?: number | "mid";
};

/**
 * Floating "windows" that lean away from the cursor, scale up slightly when it is near,
 * and bob gently on touch devices. Windows are any `.fw` inside the stage with `data-d` depth.
 * No opacity changes: they always stay solid.
 */
export function useCursorWindows({ hero, stage, dots, originY = 350, spanY = 700 }: Opts) {
  useEffect(() => {
    const heroEl = hero.current, stageEl = stage.current, dotsEl = dots.current;
    if (!heroEl || !stageEl) return;
    const fws = Array.from(stageEl.querySelectorAll<HTMLElement>(".fw"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer:fine)").matches;
    let mx = -9999, my = -9999, have = false, raf = 0;
    type C = { e: HTMLElement; cx: number; cy: number; x: number; y: number; s: number; d: number };
    let cs: C[] = [];
    const measure = () => {
      cs = fws.map((e) => ({ e, cx: e.offsetLeft + e.offsetWidth / 2, cy: e.offsetTop + e.offsetHeight / 2, x: 0, y: 0, s: 1, d: parseFloat(e.dataset.d || "1") }));
    };
    measure();
    window.addEventListener("resize", measure);
    const anims: Animation[] = [];
    const move = (ev: MouseEvent) => {
      const r = stageEl.getBoundingClientRect();
      mx = ev.clientX - r.left; my = ev.clientY - r.top; have = true;
      const h = heroEl.getBoundingClientRect();
      dotsEl?.style.setProperty("--x", ev.clientX - h.left + "px");
      dotsEl?.style.setProperty("--y", ev.clientY - h.top + "px");
    };
    const leave = () => { have = false; dotsEl?.style.setProperty("--x", "-999px"); };
    if (fine && !reduce) {
      heroEl.addEventListener("mousemove", move);
      heroEl.addEventListener("mouseleave", leave);
      const frame = () => {
        const W = stageEl.offsetWidth || 1, H = stageEl.offsetHeight || 1;
        const oy = originY === "mid" ? H / 2 : originY, sy = spanY === "mid" ? H : spanY;
        for (const c of cs) {
          let tx = 0, ty = 0, ts = 1;
          if (have) {
            const dx = mx - c.cx, dy = my - c.cy, pr = Math.max(0, 1 - Math.hypot(dx, dy) / 360);
            ts = 1 + 0.08 * pr;
            tx = -((mx - W / 2) / W) * 40 * c.d;
            ty = -((my - oy) / sy) * 40 * c.d;
          }
          c.x += (tx - c.x) * 0.08; c.y += (ty - c.y) * 0.08; c.s += (ts - c.s) * 0.1;
          c.e.style.transform = `translate3d(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px,0) scale(${c.s.toFixed(3)})`;
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    } else if (!reduce) {
      fws.forEach((e, i) =>
        anims.push(e.animate([{ transform: "translateY(0)" }, { transform: "translateY(-10px)" }, { transform: "translateY(0)" }], { duration: 4000 + i * 400, iterations: Infinity, easing: "ease-in-out" }))
      );
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      heroEl.removeEventListener("mousemove", move);
      heroEl.removeEventListener("mouseleave", leave);
      anims.forEach((a) => a.cancel());
    };
  }, [hero, stage, dots, originY, spanY]);
}
