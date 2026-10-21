"use client";
import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import { useCursorWindows } from "@/hooks/useCursorWindows";
import { CATS, boardText, type Article, type CatKey } from "@/lib/blog";

const EXTRA: Record<CatKey, { file: string; items: string[]; sticky: [string, string]; tile: string; tileCap: string }> = {
  guides: { file: "checklist.md", items: ["ask a question", "read the steps", "watch if stuck"], sticky: ["ask first,", "watch later"], tile: "1", tileCap: "credit.png" },
  updates: { file: "roadmap.md", items: ["what works now", "what is next", "no promised dates"], sticky: ["ship it,", "then say so"], tile: "→", tileCap: "next.png" },
  behind: { file: "pipeline.md", items: ["write the script", "draw the board", "render and check"], sticky: ["check what", "matters"], tile: "</>", tileCap: "code.png" },
  tips: { file: "habits.md", items: ["short sessions", "say what you tried", "write the why"], sticky: ["little and", "often"], tile: "✓", tileCap: "done.png" },
  examples: { file: "method.md", items: ["read the question", "write what is given", "pick the formula"], sticky: ["show every", "step"], tile: "x²", tileCap: "maths.png" },
};
const SUBJECT_TILE: Record<string, string> = { Maths: "x²", Physics: "F=ma", Economics: "P=Q", Coding: "O(n)" };

const cx = (o: CSSProperties & Record<string, string | number>) => o as CSSProperties;

export function ArticleHero({ a }: { a: Article }) {
  const hero = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dots = useRef<HTMLDivElement>(null);
  useCursorWindows({ hero, stage, dots, originY: 250, spanY: 500 });
  const cat = CATS[a.cat];
  const x = EXTRA[a.cat];
  const tile = (a.subject && SUBJECT_TILE[a.subject]) || x.tile;
  const tileSize = tile.length > 3 ? 34 : tile.length > 1 ? 40 : 48;
  const first = a.sections[0]?.id;

  return (
    <header className="ahero" id="hero" ref={hero}>
      <div className="dots" />
      <div className="dots2" id="dots2" ref={dots} />
      <div className="stage2" id="stage" ref={stage}>
        <div className="fw fa" data-d="1.1" style={cx({ left: "7%", top: "50px", "--w": "230px" })}>
          <div className="win"><div className="tb"><i /><i /><i /><em>×</em></div><div className="bd"><div className="scr board"><small>{cat.tag}</small><span>{boardText(a.slug)}</span></div></div></div>
          <div className="cap">{a.slug.split("-")[0]}.mov</div>
        </div>
        <div className="fw hide-m" data-d="0.7" style={cx({ left: "6%", top: "290px", "--w": "190px" })}>
          <div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr note"><div className="d">{x.items[0]}</div><div className="d">{x.items[1]}</div><div>{x.items[2]}</div></div></div></div>
          <div className="cap">{x.file}</div>
        </div>
        <div className="fw fb" data-d="0.9" style={cx({ left: "80%", top: "60px", "--w": "200px" })}>
          <div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr sticky">{x.sticky[0]}<br />{x.sticky[1]}</div></div></div>
          <div className="cap">sticky.note</div>
        </div>
        <div className="fw hide-m" data-d="1.3" style={cx({ left: "83%", top: "290px", "--w": "170px" })}>
          <div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr tile" style={{ fontSize: tileSize }}>{tile}</div></div></div>
          <div className="cap">{x.tileCap}</div>
        </div>
        <div className="nm hide-m" style={cx({ left: "20%", top: "340px", transform: "rotate(-5deg)", "--c": "#2F6BFF" })}><i>HELLO<br />my name is</i><b>doubtster</b></div>
        <div className="fold hide-m" style={{ left: "76%", top: "360px" }} />
        <div className="kao hide-m" style={{ left: "17%", top: "40px" }}>^ ω ^</div>
        <div className="kao hide-m" style={{ left: "70%", top: "30px" }}>{"{ ^_^ }"}</div>

        <div className="ahead">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/blog">blog</Link><span aria-hidden="true">/</span><Link href={`/blog#${a.cat}`}>{cat.label.toLowerCase()}</Link>
          </nav>
          <div className="metas"><span className="chip">{cat.tag.toLowerCase()}</span>{a.subject && <span>{a.subject}</span>}<span>{a.minutes} min read</span></div>
          <h1>{a.title}</h1>
          <p className="deck">{a.excerpt}</p>
          <div className="btns">
            {a.calculator && <a className="pill b" href="#calculator">try the calculator</a>}
            <a className={a.calculator ? "pill" : "pill b"} href={`#${first}`}>read the guide</a>
          </div>
        </div>
      </div>
    </header>
  );
}
