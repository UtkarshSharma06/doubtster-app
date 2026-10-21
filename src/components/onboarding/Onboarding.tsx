"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCursorWindows } from "@/hooks/useCursorWindows";
import { ONBOARDING } from "@/lib/config";

const KEY = "doubtster-onboarding";
type Data = { level: string; subjects: string[]; goals: string[]; name: string; style: string };
const EMPTY: Data = { level: "", subjects: [], goals: [], name: "", style: "" };
const cx = (o: Record<string, string>) => o as CSSProperties;

const LEVELS = ["Class 6 to 8", "Class 9 to 10", "Class 11 to 12", "College or university", "Learning on my own"];
const SUBJECTS = ["Maths", "Physics", "Chemistry", "Biology", "Economics", "Accounting", "Coding", "English", "Something else"];
const GOALS = [
  { t: "Understand it step by step", s: "Answers that show the working, not just the result." },
  { t: "Get unstuck on homework", s: "Quick help when a question will not budge." },
  { t: "Revise for an exam", s: "Notes, flashcards and quizzes on a topic." },
  { t: "Watch it explained on video", s: "A short board-style video for a tricky problem." },
];
const STYLES = [
  { t: "Short and quick", s: "Just the key steps.", i: "S" },
  { t: "Detailed and slow", s: "Every step, with the reason for it.", i: "D" },
];
const LAST = 5; // step 5 is the summary

export function Onboarding() {
  const hero = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dots = useRef<HTMLDivElement>(null);
  useCursorWindows({ hero, stage, dots, originY: "mid", spanY: "mid" });

  const [step, setStep] = useState(1);
  const [d, setD] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && typeof s === "object") {
        setD({
          level: s.level || "",
          subjects: Array.isArray(s.subjects) ? s.subjects : [],
          goals: Array.isArray(s.goals) ? s.goals : [],
          name: s.name || "",
          style: s.style || "",
        });
      }
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {}
  }, [d, ready]);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    heading.current?.focus({ preventScroll: true });
  }, [step]);

  const toggle = (k: "subjects" | "goals", v: string, max = 99) =>
    setD((p) => {
      const cur = p[k];
      if (cur.includes(v)) return { ...p, [k]: cur.filter((x) => x !== v) };
      const next = [...cur, v];
      return { ...p, [k]: next.length > max ? next.slice(next.length - max) : next };
    });

  const canNext = step === 1 ? !!d.level : step === 2 ? d.subjects.length > 0 : step === 3 ? d.goals.length > 0 : true;

  const finish = async () => {
    setBusy(true);
    if (!ONBOARDING.DEMO) {
      try {
        await fetch(ONBOARDING.ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(d) });
      } catch {}
    } else {
      await new Promise((r) => setTimeout(r, 350));
    }
    setBusy(false);
    setStep(LAST);
  };
  const next = () => (step < LAST - 1 ? setStep(step + 1) : finish());
  const skip = () => (step < LAST - 1 ? setStep(step + 1) : finish());
  const go = (question: string) => {
    const url = ONBOARDING.CHAT_URL + (question ? "?q=" + encodeURIComponent(question) : "");
    window.location.href = url;
  };

  const summary: [string, string][] = ([
    ["Level", d.level],
    ["Subjects", d.subjects.join(", ")],
    ["Goals", d.goals.join(", ")],
    ["Style", d.style],
  ] as [string, string][]).filter(([, v]) => v);

  const pct = step === LAST ? 100 : (step / LAST) * 100;

  return (
    <div className="pg-onb">
      <a className="skip" href="#main">Skip to form</a>
      <Header cta={{ href: "/app", label: step === LAST ? "go to chat" : "skip for now" }} />
      <main id="main" className="auth onb" ref={hero}>
        <div className="dots" />
        <div className="dots2" id="dots2" ref={dots} />
        <div className="stage2" id="stage" ref={stage}>
          <div className="fw" data-d="1.0" style={cx({ left: "6%", top: "12%", "--w": "215px" })}>
            <div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr chat"><span className="u">explain this step by step</span><span className="a">Sure. Step 1: ...</span></div></div></div>
            <div className="cap">chat.txt</div>
          </div>
          <div className="fw" data-d="1.3" style={cx({ left: "76%", top: "9%", "--w": "230px" })}>
            <div className="win"><div className="tb"><i /><i /><i /><em>×</em></div><div className="bd"><div className="scr board"><small>WELCOME</small><span>let us set it up</span></div></div></div>
            <div className="cap">hello.mov</div>
          </div>
          <div className="fw" data-d="0.7" style={cx({ left: "4%", top: "62%", "--w": "200px" })}>
            <div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr note"><div className="d">your level</div><div className="d">your subjects</div><div>your goal</div></div></div></div>
            <div className="cap">setup.md</div>
          </div>
          <div className="fw" data-d="0.9" style={cx({ left: "80%", top: "60%", "--w": "180px" })}>
            <div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr sticky">takes about<br />30 seconds</div></div></div>
            <div className="cap">sticky.note</div>
          </div>
          <div className="nm" style={cx({ left: "17%", top: "40%", transform: "rotate(-5deg)", "--c": "#2F6BFF" })}><i>HELLO<br />my name is</i><b>doubtster</b></div>
          <div className="fold" style={{ left: "72%", top: "42%" }} />
          <div className="kao" style={{ left: "28%", top: "10%" }}>^ ω ^</div>
          <div className="kao" style={{ left: "66%", top: "86%" }}>(¬_¬)</div>
        </div>

        <div className="card">
          <div className="win">
            <div className="tb"><i /><i /><i /><em>welcome.app</em></div>
            <div className="bd"><div className="in2">
              <div className="pg" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={5} aria-valuenow={step}>
                <i style={{ width: pct + "%" }} />
              </div>
              <div className="stp"><span>{step < LAST ? `Step ${step} of ${LAST - 1}` : "All done"}</span><span>You can change all of this later</span></div>

              {step === 1 && (
                <section className="step">
                  <h1 tabIndex={-1} ref={heading}>what are you studying at?</h1>
                  <p className="lead">This helps us pitch explanations at the right level.</p>
                  <div className="chips" role="group" aria-label="Level">
                    {LEVELS.map((l) => (
                      <button key={l} className="chip2" type="button" aria-pressed={d.level === l} onClick={() => setD((p) => ({ ...p, level: p.level === l ? "" : l }))}>{l}</button>
                    ))}
                  </div>
                </section>
              )}
              {step === 2 && (
                <section className="step">
                  <h1 tabIndex={-1} ref={heading}>which subjects do you need help with?</h1>
                  <p className="lead">Pick as many as you like.</p>
                  <div className="chips" role="group" aria-label="Subjects">
                    {SUBJECTS.map((s) => (
                      <button key={s} className="chip2" type="button" aria-pressed={d.subjects.includes(s)} onClick={() => toggle("subjects", s)}>{s}</button>
                    ))}
                  </div>
                </section>
              )}
              {step === 3 && (
                <section className="step">
                  <h1 tabIndex={-1} ref={heading}>what do you want most from Doubtster?</h1>
                  <p className="lead">Pick up to two.</p>
                  <div className="opts" role="group" aria-label="Goals">
                    {GOALS.map((g, i) => (
                      <button key={g.t} className="opt" type="button" aria-pressed={d.goals.includes(g.t)} onClick={() => toggle("goals", g.t, 2)}>
                        <span className="ic" aria-hidden="true">{i + 1}</span>
                        <span><b>{g.t}</b><span className="s">{g.s}</span></span>
                        <i className="tick" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {step === 4 && (
                <section className="step">
                  <h1 tabIndex={-1} ref={heading}>how should we talk to you?</h1>
                  <p className="lead">Your name is optional. The style is a starting point you can change in any chat.</p>
                  <div className="fld2">
                    <label htmlFor="nm">What should we call you?</label>
                    <input id="nm" type="text" autoComplete="given-name" maxLength={40} placeholder="Your first name" value={d.name} onChange={(e) => setD((p) => ({ ...p, name: e.target.value.trimStart() }))} />
                  </div>
                  <div className="opts" role="group" aria-label="Explanation style">
                    {STYLES.map((s) => (
                      <button key={s.t} className="opt" type="button" aria-pressed={d.style === s.t} onClick={() => setD((p) => ({ ...p, style: p.style === s.t ? "" : s.t }))}>
                        <span className="ic" aria-hidden="true">{s.i}</span>
                        <span><b>{s.t}</b><span className="s">{s.s}</span></span>
                        <i className="tick" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {step === LAST && (
                <section className="step">
                  <h1 tabIndex={-1} ref={heading}>{d.name.trim() ? `you are all set, ${d.name.trim().toLowerCase()}` : "you are all set"}</h1>
                  <p className="lead">Here is what we noted. Ask your first question, or just jump in.</p>
                  {summary.length > 0 && (
                    <div className="sum">
                      {summary.map(([k, v]) => (<div key={k}><span>{k}</span><b>{v}</b></div>))}
                    </div>
                  )}
                  <form className="qbox" onSubmit={(e) => { e.preventDefault(); go(q.trim()); }}>
                    <label className="sr" htmlFor="q">Your first question</label>
                    <input id="q" type="text" maxLength={300} value={q} onChange={(e) => setQ(e.target.value)}
                      placeholder={d.subjects[0] && d.subjects[0] !== "Something else" ? `e.g. a ${d.subjects[0].toLowerCase()} question you are stuck on` : "Type a question, any subject"} />
                    <button type="submit" aria-label="Ask">&#8593;</button>
                  </form>
                  <button className="alt" type="button" onClick={() => go("")}>go to chat</button>
                  <a className="alt" href="/app#videos">want videos too? see the $1.99 trial</a>
                  <p className="hint">Chat is always free. AI explanations can contain mistakes. Check important answers with your teacher.</p>
                </section>
              )}

              {step < LAST && (
                <>
                  <div className="nav2">
                    <button className="bk" type="button" onClick={() => setStep(step - 1)} style={step === 1 ? { visibility: "hidden" } : undefined}>&larr; Back</button>
                    <button className="go2" type="button" onClick={next} disabled={(!canNext && step < 4) || busy} style={{ opacity: (!canNext && step < 4) || busy ? 0.55 : 1 }}>
                      <span>{step === LAST - 1 ? "Finish" : "Continue"}</span>
                    </button>
                  </div>
                  <p className="skp"><button type="button" onClick={skip}>Skip this step</button></p>
                </>
              )}
            </div></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
