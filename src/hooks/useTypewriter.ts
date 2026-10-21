"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Types each phrase, holds, deletes, moves on. Returns the text to show and a `paused`
 * toggle so the caller can stop it while the user is typing.
 */
export function useTypewriter(phrases: string[], paused: boolean) {
  const [text, setText] = useState("");
  const state = useRef({ i: 0, j: 0, del: false });
  useEffect(() => {
    if (paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setText(phrases[0]); return; }
    let t: number;
    const s = state.current;
    s.j = 0; s.del = false; setText("");
    const tick = () => {
      const cur = phrases[s.i];
      if (!s.del) {
        s.j++; setText(cur.slice(0, s.j));
        if (s.j >= cur.length) { s.del = true; t = window.setTimeout(tick, 1700); return; }
        t = window.setTimeout(tick, 38 + Math.random() * 45);
      } else {
        s.j -= 2;
        if (s.j <= 0) { s.j = 0; s.del = false; s.i = (s.i + 1) % phrases.length; setText(""); t = window.setTimeout(tick, 450); return; }
        setText(cur.slice(0, s.j)); t = window.setTimeout(tick, 18);
      }
    };
    t = window.setTimeout(tick, 200);
    return () => window.clearTimeout(t);
  }, [paused, phrases]);
  return text;
}
