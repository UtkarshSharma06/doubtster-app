"use client";
import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import { useCursorWindows } from "@/hooks/useCursorWindows";
import { LEGAL, LEGAL_ORDER, type LegalKey } from "@/lib/legalMeta";

const cx = (o: Record<string, string>) => o as CSSProperties;

export function LegalHero({ current, eff, upd, ver }: { current: LegalKey; eff: string; upd: string; ver: string }) {
  const hero = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dots = useRef<HTMLDivElement>(null);
  useCursorWindows({ hero, stage, dots, originY: 150, spanY: 300 });
  const d = LEGAL[current];
  return (
    <header className="lhero" id="hero" ref={hero}>
      <div className="dots" />
      <div className="dots2" id="dots2" ref={dots} />
      <div className="stage2" id="stage" ref={stage}>
        <div className="fw" data-d="1.1" style={cx({ left: "9%", top: "10px", "--w": "200px" })}>
          <div className="win"><div className="tb"><i /><i /><i /><em>×</em></div><div className="bd"><div className="scr board"><small>THE SHORT VERSION</small><span>be kind, check answers</span></div></div></div>
          <div className="cap">read-me.mov</div>
        </div>
        <div className="fw" data-d="0.9" style={cx({ left: "80%", top: "30px", "--w": "180px" })}>
          <div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr sticky">chat is<br />always free</div></div></div>
          <div className="cap">sticky.note</div>
        </div>
        <div className="fw" data-d="0.7" style={cx({ left: "3%", top: "225px", "--w": "165px" })}>
          <div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr note"><div className="d">cancel anytime</div><div className="d">AI can be wrong</div><div>your data is yours</div></div></div></div>
          <div className="cap">checklist.md</div>
        </div>
        <div className="nm" style={cx({ left: "77%", top: "210px", transform: "rotate(6deg)", "--c": "#E5483B" })}><i>HELLO<br />my name is</i><b>doubtster</b></div>
        <div className="fold" style={{ left: "23%", top: "200px" }} />
        <div className="kao" style={{ left: "70%", top: "12px" }}>{"{ ^_^ }"}</div>

        <div className="lhead">
          <h1>{d.word}</h1>
          <p className="sub">{d.sub}</p>
          <div className="tabs" role="navigation" aria-label="Legal pages">
            {LEGAL_ORDER.map((k) => (
              <Link key={k} href={`/${k}`} aria-current={k === current ? "page" : undefined}>{LEGAL[k].word}</Link>
            ))}
          </div>
          <div className="metas">
            <span>Effective <span dangerouslySetInnerHTML={{ __html: eff }} /></span>
            <span>Updated <span dangerouslySetInnerHTML={{ __html: upd }} /></span>
            <span>Version {ver}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
