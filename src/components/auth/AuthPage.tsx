"use client";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCursorWindows } from "@/hooks/useCursorWindows";
import { AUTH, site } from "@/lib/config";

type Mode = "signup" | "login";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const cx = (o: Record<string, string>) => o as CSSProperties;
type Note = { text: string; kind: "info" | "bad" | "good" } | null;

const COPY = {
  signup: {
    file: "signup.app",
    h1: "create your account",
    lead: "Chat is always free. Add videos any time with a $1.99 trial.",
    google: "Sign up with Google",
    submit: "Create account",
    endpoint: AUTH.SIGNUP_ENDPOINT,
  },
  login: {
    file: "login.app",
    h1: "welcome back",
    lead: "Log in to pick up where you left off.",
    google: "Continue with Google",
    submit: "Log in",
    endpoint: AUTH.LOGIN_ENDPOINT,
  },
} as const;

export function AuthPage({ mode }: { mode: Mode }) {
  const c = COPY[mode];
  const hero = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dots = useRef<HTMLDivElement>(null);
  useCursorWindows({ hero, stage, dots, originY: "mid", spanY: "mid" });

  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errs, setErrs] = useState<{ em?: string; pw?: string; agree?: string }>({});
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"main" | "reset">("main");
  const [rem, setRem] = useState("");
  const [remErr, setRemErr] = useState("");
  const [rnote, setRnote] = useState<Note>(null);
  const emRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const agreeRef = useRef<HTMLInputElement>(null);
  const remRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQ((new URLSearchParams(window.location.search).get("q") ?? "").trim().slice(0, 300));
  }, []);

  const strength = (() => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s++;
    return s;
  })();
  const METER = ["#E5483B", "#F2A33A", "#4FB66B", "#1E9A47"];
  const LAB = ["", "Weak", "Fair", "Good", "Strong"];

  const google = () => {
    if (AUTH.DEMO) {
      setNote({ text: `Demo mode: Google sign in would go to ${AUTH.GOOGLE_URL} now. Connect your server route and set NEXT_PUBLIC_DEMO=false.`, kind: "info" });
      return;
    }
    window.location.href = AUTH.GOOGLE_URL + (q ? "?q=" + encodeURIComponent(q) : "");
  };

  const validate = () => {
    const e: typeof errs = {};
    if (!emailRe.test(email.trim())) e.em = "Enter a valid email address.";
    if (mode === "signup") { if (pw.length < 8) e.pw = "Password is too short."; }
    else if (!pw) e.pw = "Enter your password.";
    if (mode === "signup" && !agree) e.agree = "Please confirm to continue.";
    setErrs(e);
    if (e.em) emRef.current?.focus();
    else if (e.pw) pwRef.current?.focus();
    else if (e.agree) agreeRef.current?.focus();
    return !e.em && !e.pw && !e.agree;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setNote(null);
    if (!validate()) return;
    setBusy(true);
    const body: Record<string, unknown> = { email: email.trim(), password: pw };
    if (mode === "signup") { body.name = name.trim(); body.ageOk = true; }
    if (q) body.q = q;
    if (AUTH.DEMO) {
      setTimeout(() => {
        setBusy(false);
        setNote({ text: `Demo mode: this form is ready to send to ${c.endpoint}. Connect your backend and set NEXT_PUBLIC_DEMO=false. Nothing was saved.`, kind: "info" });
      }, 700);
      return;
    }
    try {
      const r = await fetch(c.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      setBusy(false);
      if (r.ok) window.location.href = AUTH.AFTER;
      else setNote({ text: j.error || "Something went wrong. Please check your details and try again.", kind: "bad" });
    } catch {
      setBusy(false);
      setNote({ text: "Could not reach the server. Check your connection and try again.", kind: "bad" });
    }
  };

  const submitReset = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = rem.trim();
    if (!emailRe.test(e)) { setRemErr("Enter a valid email address."); remRef.current?.focus(); return; }
    setRemErr("");
    if (AUTH.DEMO) {
      setRnote({ text: `Demo mode: this would send a reset link to ${e} via ${AUTH.RESET_ENDPOINT}. Nothing was sent.`, kind: "info" });
      return;
    }
    const ok = () => setRnote({ text: `If an account exists for ${e}, a reset link is on its way. Check your spam folder too.`, kind: "good" });
    fetch(AUTH.RESET_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e }) }).then(ok, ok);
  };

  const carry = q ? `?q=${encodeURIComponent(q)}` : "";
  const other = mode === "signup" ? { href: "/login", label: "log in" } : { href: "/signup", label: "sign up" };

  return (
    <div className="pg-auth">
      <a className="skip" href="#main">Skip to form</a>
      <Header cta={other} />
      <main id="main" className="auth" ref={hero}>
        <div className="dots" />
        <div className="dots2" id="dots2" ref={dots} />
        <div className="stage2" id="stage" ref={stage}>
          <div className="fw" data-d="1.0" style={cx({ left: "6%", top: "12%", "--w": "215px" })}>
            <div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr chat"><span className="u">why does ice float?</span><span className="a">Solid water is less dense. Step 1: ...</span></div></div></div>
            <div className="cap">chat.txt</div>
          </div>
          <div className="fw" data-d="1.3" style={cx({ left: "74%", top: "9%", "--w": "240px" })}>
            <div className="win"><div className="tb"><i /><i /><i /><em>×</em></div><div className="bd"><div className="scr board"><small>SCENE 4 OF 6</small><span>30,000 × 0.85⁶</span></div></div></div>
            <div className="cap">car-loan.mov</div>
          </div>
          <div className="fw" data-d="0.7" style={cx({ left: "4%", top: "60%", "--w": "200px" })}>
            <div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr note"><div className="d">read the question</div><div className="d">write what is given</div><div>pick the formula</div><div>check the units</div></div></div></div>
            <div className="cap">checklist.md</div>
          </div>
          <div className="fw" data-d="0.9" style={cx({ left: "80%", top: "58%", "--w": "185px" })}>
            <div className="win"><div className="tb"><i /><i /><i /></div><div className="bd"><div className="scr sticky">step 3:<br />divide both sides</div></div></div>
            <div className="cap">sticky.note</div>
          </div>
          <div className="nm" style={cx({ left: "18%", top: "42%", transform: "rotate(-5deg)", "--c": "#2F6BFF" })}><i>HELLO<br />my name is</i><b>doubtster</b></div>
          <div className="fold" style={{ left: "70%", top: "44%" }} />
          <div className="kao" style={{ left: "28%", top: "10%" }}>^ ω ^</div>
          <div className="kao" style={{ left: "66%", top: "84%" }}>(¬_¬)</div>
        </div>

        <div className="card">
          <div className="win">
            <div className="tb"><i /><i /><i /><em>{c.file}</em></div>
            <div className="bd">
              <div className="in2">
                <div className="mk">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/doubtster-icon.svg" alt="Doubtster" /></div>

                <div className="view" hidden={view !== "main"}>
                  <h1>{c.h1}</h1>
                  <p className="lead">{c.lead}</p>
                  {q && <div className="ask"><span aria-hidden="true">?</span><span><b>Your question:</b> <span>{q}</span></span></div>}
                  {note && <div className={`msg ${note.kind}`} role="alert">{note.text}</div>}
                  <button className="gbtn" type="button" onClick={google}>
                    <svg viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{c.google}</span>
                  </button>
                  <div className="or"><span>or use your email</span></div>

                  <form className="f" onSubmit={submit} noValidate>
                    {mode === "signup" && (
                      <div className="fld">
                        <label htmlFor="nm"><span>Name <span style={{ color: "var(--mute)", fontWeight: 400 }}>(optional)</span></span></label>
                        <div className="ip"><input id="nm" type="text" autoComplete="given-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></div>
                      </div>
                    )}
                    <div className="fld">
                      <label htmlFor="em">Email</label>
                      <div className="ip">
                        <input id="em" ref={emRef} type="email" autoComplete="email" inputMode="email" required aria-describedby="emErr" aria-invalid={errs.em ? "true" : "false"}
                          value={email} onChange={(e) => { setEmail(e.target.value); if (errs.em) setErrs((x) => ({ ...x, em: "" })); }} />
                      </div>
                      <p className="err" id="emErr" role="alert">{errs.em}</p>
                    </div>
                    <div className="fld">
                      <label htmlFor="pw">
                        <span>Password</span>
                        {mode === "login" && (
                          <a href="#" onClick={(e) => { e.preventDefault(); setRem(email); setView("reset"); setTimeout(() => remRef.current?.focus(), 0); }}>Forgot password?</a>
                        )}
                      </label>
                      <div className="ip">
                        <input id="pw" ref={pwRef} type={showPw ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required aria-describedby="pwErr"
                          aria-invalid={errs.pw ? "true" : "false"} style={{ paddingRight: 64 }}
                          value={pw} onChange={(e) => { setPw(e.target.value); if (errs.pw) setErrs((x) => ({ ...x, pw: "" })); }} />
                        <button className="eye" type="button" aria-pressed={showPw} aria-label="Show or hide password" onClick={() => setShowPw((s) => !s)}>{showPw ? "Hide" : "Show"}</button>
                      </div>
                      {mode === "signup" && (
                        <>
                          <div className="meter" aria-hidden="true">
                            {[0, 1, 2, 3].map((k) => <i key={k} style={{ background: k < strength ? METER[strength - 1] : undefined }} />)}
                          </div>
                          <p className="mt">{pw ? LAB[strength] + (pw.length < 8 ? " (use at least 8 characters)" : "") : "Use at least 8 characters."}</p>
                        </>
                      )}
                      <p className="err" id="pwErr" role="alert">{errs.pw}</p>
                    </div>
                    {mode === "signup" && (
                      <div>
                        <label className="chk">
                          <input id="agree" ref={agreeRef} type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} aria-describedby="agreeErr" />
                          <span>I am at least 16 (or have a parent or guardian&apos;s permission) and I agree to the <a href={site("/terms")}>Terms</a> and <a href={site("/privacy")}>Privacy Policy</a>.</span>
                        </label>
                        <p className="err" id="agreeErr" role="alert">{errs.agree}</p>
                      </div>
                    )}
                    <button className={`go2${busy ? " load" : ""}`} type="submit" disabled={busy}>
                      <span className="spin" aria-hidden="true" />
                      <span>{c.submit}</span>
                    </button>
                  </form>

                  <p className="sw">
                    {mode === "signup" ? (<>Already have an account? <Link href={"/login" + carry}>Log in</Link></>) : (<>New to Doubtster? <Link href={"/signup" + carry}>Create a free account</Link></>)}
                  </p>
                  {mode === "signup" && (
                    <div className="perks"><span>Free chat</span><span>Notes and flashcards</span><span>Quizzes</span><span>Videos with a trial</span></div>
                  )}
                </div>

                {mode === "login" && (
                  <div className="view" hidden={view !== "reset"}>
                    <a className="back" href="#" onClick={(e) => { e.preventDefault(); setView("main"); setTimeout(() => emRef.current?.focus(), 0); }}>&larr; Back to log in</a>
                    <h1>Reset your password</h1>
                    <p className="lead">Enter your email and we will send you a link to choose a new one.</p>
                    {rnote && <div className={`msg ${rnote.kind}`} role="status">{rnote.text}</div>}
                    <form className="f" onSubmit={submitReset} noValidate>
                      <div className="fld">
                        <label htmlFor="rem">Email</label>
                        <div className="ip"><input id="rem" ref={remRef} type="email" autoComplete="email" inputMode="email" aria-describedby="remErr" aria-invalid={remErr ? "true" : "false"} value={rem} onChange={(e) => setRem(e.target.value)} /></div>
                        <p className="err" id="remErr" role="alert">{remErr}</p>
                      </div>
                      <button className="go2" type="submit">Send reset link</button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <p className="fine3" style={{ position: "relative", zIndex: 5, margin: "0 auto 40px", padding: "0 16px" }}>
        {mode === "signup" ? (
          <>By continuing you agree to our <a href={site("/terms")}>Terms</a> and <a href={site("/privacy")}>Privacy Policy</a>.</>
        ) : (
          <>Trouble logging in? Use &quot;Forgot password&quot; or write to us at <a href="mailto:contact@doubtster.com">contact@doubtster.com</a>.</>
        )}{" "}
        AI explanations can contain mistakes. Check important answers with your teacher.
      </p>
      <Footer />
    </div>
  );
}
