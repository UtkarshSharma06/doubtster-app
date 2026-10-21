"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Toc = { id: string; title: string }[];

/** Contents rail (scroll-spy, progress), copy/print tools, and the article body. Handles "#" anchor copy and in-site links. */
export function LegalReader({ toc, html, fname, title }: { toc: Toc; html: string; fname: string; title: string }) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [read, setRead] = useState(0);
  const [copied, setCopied] = useState(false);
  const [openToc, setOpenToc] = useState(true);
  const prose = useRef<HTMLElement>(null);
  const tick = useRef(0);

  useEffect(() => {
    if (window.innerWidth < 900) setOpenToc(false);
  }, []);

  useEffect(() => {
    const bar = document.getElementById("pbar");
    const calc = () => {
      const el = prose.current;
      if (!el) return;
      const r = el.getBoundingClientRect(), vh = innerHeight;
      const total = Math.max(1, r.height - vh * 0.6);
      const p = Math.min(1, Math.max(0, (vh * 0.3 - r.top) / total));
      setRead(p);
      if (bar) bar.style.transform = `scaleX(${p})`;
      let cur: string | null = null;
      for (const t of toc) {
        const s = document.getElementById(t.id);
        if (s && s.getBoundingClientRect().top < vh * 0.35) cur = t.id;
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
  }, [toc]);

  const copy = async (text: string, after?: () => void) => {
    try { await navigator.clipboard.writeText(text); after?.(); } catch {}
  };

  const onClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    const btn = t.closest<HTMLElement>(".anchor");
    if (btn) {
      const old = btn.textContent;
      copy(`${location.origin}${location.pathname}#${btn.dataset.id}`, () => {
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = old), 1400);
      });
      return;
    }
    const a = t.closest<HTMLAnchorElement>("a[href^='/']");
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && a.target !== "_blank") {
      e.preventDefault();
      router.push(a.getAttribute("href")!);
    }
  };

  return (
    <div className="cols3">
      <aside className="rail" aria-label="Reading tools">
        <div className="win">
          <div className="tb"><i /><i /><i /><em>contents</em></div>
          <div className="bd">
            <details className="toc" open={openToc} onToggle={(e) => setOpenToc((e.target as HTMLDetailsElement).open)}>
              <summary>On this page</summary>
              <ol style={{ ["--read" as string]: read }}>
                {toc.map((t) => (
                  <li key={t.id}><a href={`#${t.id}`} aria-current={active === t.id ? "true" : undefined}>{t.title}</a></li>
                ))}
              </ol>
            </details>
          </div>
        </div>
        <div className="tools">
          <button type="button" onClick={() => copy(location.href.split("#")[0], () => { setCopied(true); setTimeout(() => setCopied(false), 1400); })}>
            {copied ? "Copied" : "Copy link"}
          </button>
          <button type="button" onClick={() => window.print()}>Print</button>
        </div>
      </aside>

      <div className="win paper">
        <div className="tb"><i /><i /><i /><em>{fname}</em></div>
        <div className="bd" style={{ padding: 0 }}>
          <article
            className="prose pad"
            id="prose"
            ref={prose}
            onClick={onClick}
            dangerouslySetInnerHTML={{
              __html:
                `<h1 class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">${title}</h1>` +
                html +
                `<p class="endnote">This page is a plain-language document, not legal advice. Questions about it? Write to us at the contact details in the last section.</p>`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
