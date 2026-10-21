"use client";
import { useEffect, useRef, useState } from "react";

const SIZES = [16, 17.5, 19.5, 21.5];
const KEY = "doubtster-text-size";

export function CopyLink({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="anchor"
      aria-label="Copy link to this section"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`${location.origin}${location.pathname}#${id}`);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {}
      }}
    >
      {done ? "Copied" : "#"}
    </button>
  );
}

/** Contents rail: scroll-spy, reading progress, time left, text size and share tools. */
export function ReadingTools({ sections, title, slug }: { sections: { id: string; heading: string }[]; title: string; slug: string }) {
  const [size, setSize] = useState(1);
  const [active, setActive] = useState(sections[0]?.id);
  const [read, setRead] = useState(0);
  const [left, setLeft] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [href, setHref] = useState("");
  const tick = useRef(0);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v !== null && +v >= 0 && +v < SIZES.length) setSize(+v);
    } catch {}
    setCanShare("share" in navigator);
    setHref(location.href.split("#")[0]);
  }, []);

  useEffect(() => {
    const wrap = document.querySelector<HTMLElement>(".pg-post");
    wrap?.style.setProperty("--prose", `${SIZES[size]}px`);
    try { localStorage.setItem(KEY, String(size)); } catch {}
  }, [size]);

  useEffect(() => {
    const prose = document.getElementById("prose");
    const bar = document.getElementById("pbar");
    const words = (prose?.textContent ?? "").split(/\s+/).length;
    const calc = () => {
      if (!prose) return;
      const r = prose.getBoundingClientRect();
      const vh = innerHeight;
      const total = Math.max(1, r.height - vh * 0.6);
      const p = Math.min(1, Math.max(0, (vh * 0.3 - r.top) / total));
      setRead(p);
      if (bar) bar.style.transform = `scaleX(${p})`;
      setLeft(p >= 0.98 ? "You have finished" : `${Math.max(1, Math.ceil((words / 220) * (1 - p)))} min left`);
      let cur = sections[0]?.id;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < vh * 0.35) cur = s.id;
      }
      setActive(cur);
    };
    const on = () => { cancelAnimationFrame(tick.current); tick.current = requestAnimationFrame(calc); };
    calc();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
      cancelAnimationFrame(tick.current);
      if (bar) bar.style.transform = "";
    };
  }, [sections, size]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(href); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  };

  return (
    <aside className="rail" aria-label="Reading tools">
      <div className="win">
        <div className="tb"><i /><i /><i /><em>contents</em></div>
        <div className="bd">
          <details className="toc" open>
            <summary>On this page</summary>
            <ol style={{ ["--read" as string]: read }}>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}>{s.heading}</a>
                </li>
              ))}
            </ol>
          </details>
        </div>
      </div>
      <p className="left" data-slug={slug}>{left}</p>
      <div className="tools">
        <button type="button" onClick={() => setSize((s) => Math.max(0, s - 1))} disabled={size === 0} aria-label="Smaller text">A&minus;</button>
        <button type="button" onClick={() => setSize((s) => Math.min(SIZES.length - 1, s + 1))} disabled={size === SIZES.length - 1} aria-label="Larger text">A+</button>
        <button type="button" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
        <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(href)}`}>Email</a>
        {canShare && <button type="button" onClick={() => navigator.share({ title, url: href }).catch(() => {})}>Share</button>}
      </div>
    </aside>
  );
}
