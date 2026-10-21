"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCursorWindows } from "@/hooks/useCursorWindows";
import { useTypewriter } from "@/hooks/useTypewriter";
import { ARTICLES } from "@/content/articles";
import { CATS, CAT_ORDER, matches, type CatKey } from "@/lib/blog";
import { BlogStage } from "./BlogStage";
import { CARD_STYLE, ICON_PATHS } from "./cardStyle";

const PHRASES = [
  "how do credits work?",
  "reducing balance depreciation",
  "a simple weekly revision plan",
  "what happens on day 7 of the trial?",
  "velocity and acceleration",
  "big o notation",
];
const CHIPS = ["credits", "depreciation", "revision plan"];

type Filter = "all" | CatKey;

export function BlogHome() {
  const hero = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dots = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLHeadingElement>(null);
  useCursorWindows({ hero, stage, dots });

  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const paused = focused || q.length > 0;
  const typed = useTypewriter(PHRASES, paused);

  // Deep link: /blog#examples opens that filter.
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h && (CAT_ORDER as string[]).includes(h)) setFilter(h as CatKey);
  }, []);
  const pick = (f: Filter) => {
    setFilter(f);
    try { history.replaceState(null, "", f === "all" ? window.location.pathname : "#" + f); } catch {}
  };

  const shown = useMemo(() => ARTICLES.filter((a) => (filter === "all" || a.cat === filter) && matches(a, q)), [filter, q]);
  const count = (f: Filter) => (f === "all" ? ARTICLES.length : ARTICLES.filter((a) => a.cat === f).length);
  const label = `${shown.length} ${shown.length === 1 ? "article" : "articles"}`;
  const examples = ARTICLES.filter((a) => a.cat === "examples");

  return (
    <main id="main">
      <section className="hero" id="hero" ref={hero}>
        <div className="dots" />
        <div className="dots2" id="dots2" ref={dots} />
        <div className="stage" id="stage" ref={stage}>
          <BlogStage />
          <div className="center">
            <h1>blog</h1>
            <p className="sub">guides, ideas and worked examples</p>
            <div className="hchat" role="search">
              <div className="hc-top">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/doubtster-icon.svg" alt="" />
                <span>search the blog</span>
                <span className="free" role="status" aria-live="polite">{label}</span>
              </div>
              <div className="row2">
                <div className="tw">
                  {!paused && (
                    <div className="ty" aria-hidden="true">
                      {typed}
                      <i />
                    </div>
                  )}
                  <label className="sr" htmlFor="q">Search articles</label>
                  <input
                    id="q"
                    type="search"
                    autoComplete="off"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                  />
                </div>
              </div>
              <div className="chipsr">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setQ(c);
                      grid.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="start wrap" aria-label="Start here">
        <Link href="/blog/start-here-how-doubtster-works">
          <div className="win">
            <div className="tb"><i /><i /><i /><em>start-here.md</em></div>
            <div className="bdy">
              <div>
                <span className="badge">start here</span>
                <h2>How Doubtster works</h2>
                <p>Ask a question, read the answer, and turn it into a short explainer video when you want to see it worked out.</p>
                <span className="pill b" style={{ height: 42, fontSize: 16 }}>read the guide</span>
              </div>
              <div className="st3">
                <div><b>1</b>Ask<span>chat is free</span></div>
                <div><b>2</b>Read<span>step by step</span></div>
                <div><b>3</b>Watch<span>1 credit a video</span></div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      <div className="fbar">
        <div className="wrap" role="group" aria-label="Filter by category">
          <button className="fp" aria-pressed={filter === "all"} onClick={() => pick("all")}>All <i>{count("all")}</i></button>
          {CAT_ORDER.map((k) => (
            <button key={k} className="fp" aria-pressed={filter === k} onClick={() => pick(k)}>
              {CATS[k].label} <i>{count(k)}</i>
            </button>
          ))}
        </div>
      </div>

      <div className="wrap">
        <section className="sec" aria-labelledby="all-h">
          <div className="hd">
            <h2 id="all-h" ref={grid}>all articles</h2>
            <span className="cnt">{label}</span>
          </div>
          <div className="ag" id="grid">
            {shown.map((a) => {
              const cs = CARD_STYLE[a.cat];
              return (
                <article className="card" key={a.slug}>
                  <Link href={`/blog/${a.slug}`}>
                    <div className="win">
                      <div className="tb"><i /><i /><i /><em>{a.slug.slice(0, 26)}.md</em></div>
                      <div className="bd2c">
                        <div className="thumb" style={{ "--fg": cs.fg, "--bg2": cs.bg } as React.CSSProperties}>
                          <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                            {ICON_PATHS[cs.icon].map((d) => <path key={d} d={d} />)}
                          </svg>
                        </div>
                        <div className="cb2">
                          <p className="meta">
                            <span className="cat" style={{ color: cs.fg }}>{CATS[a.cat].label}</span>
                            {a.subject && <span>{a.subject}</span>}
                            <span>{a.minutes} min read</span>
                          </p>
                          <h3>{a.title}</h3>
                          <p className="ex">{a.excerpt}</p>
                          <span className="more">read article</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
          {shown.length === 0 && (
            <div className="empty">
              <h3>No articles match</h3>
              <p>Try a different word, or clear the filters.</p>
              <button className="pill" type="button" onClick={() => { setQ(""); pick("all"); }}>clear filters</button>
            </div>
          )}
        </section>
      </div>

      <section className="exs wrap" aria-labelledby="ex-h">
        <div className="win">
          <div className="tb"><i /><i /><i /><em>worked-examples</em></div>
          <div className="bdy">
            <div>
              <h2 id="ex-h">worked examples</h2>
              <p>Real questions solved one step at a time, across maths, physics, economics and coding.</p>
            </div>
            <ul>
              {examples.map((a) => (
                <li key={a.slug}>
                  <Link href={`/blog/${a.slug}`}>
                    <span className="sb2">{a.subject}</span>
                    <b>{a.title}</b>
                    <span className="m">{a.minutes} min</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="cta sky">
        <div className="wrap">
          <h2>stuck on a question right now?</h2>
          <p>Chat is always free. Videos start with a $1.99 trial.</p>
          <div className="btns">
            <Link className="pill w" href="/signup">start your trial</Link>
            <Link className="pill" href="/app">ask in chat, free</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
