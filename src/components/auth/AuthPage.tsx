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
  const [isStudent, setIsStudent] = useState(false);
  const [collegeStatus, setCollegeStatus] = useState<{
    checked: boolean;
    approved: boolean;
    domain: string;
    message: string;
    college?: { name: string; credits: number };
  } | null>(null);
  const [collegeChecking, setCollegeChecking] = useState(false);

  const [errs, setErrs] = useState<{ em?: string; pw?: string; agree?: string }>({});
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"main" | "reset" | "otp">("main");

  // OTP state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpType, setOtpType] = useState<"signup" | "email">("signup");
  const [otpNote, setOtpNote] = useState<Note>(null);
  const [otpBusy, setOtpBusy] = useState(false);

  const [rem, setRem] = useState("");
  const [remErr, setRemErr] = useState("");
  const [rnote, setRnote] = useState<Note>(null);

  const emRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const agreeRef = useRef<HTMLInputElement>(null);
  const remRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQ((new URLSearchParams(window.location.search).get("q") ?? "").trim().slice(0, 300));
  }, []);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setInterval(() => {
      setOtpCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [otpCountdown]);

  // Live college domain verification when isStudent is toggled or email changes
  useEffect(() => {
    if (!isStudent) {
      setCollegeStatus(null);
      return;
    }

    const trimmed = email.trim().toLowerCase();
    const domainMatch = /^[^\s@]+@([^\s@]+\.[^\s@]{2,})$/.exec(trimmed);
    if (!domainMatch) {
      setCollegeStatus(null);
      return;
    }

    const dom = domainMatch[1];
    let cancelled = false;
    setCollegeChecking(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(AUTH.CHECK_COLLEGE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setCollegeChecking(false);
          setCollegeStatus({
            checked: true,
            approved: !!data.approved,
            domain: dom,
            message: data.message || (data.approved ? "Approved college domain." : "Doubtster is not in your college yet"),
            college: data.college,
          });
        }
      } catch {
        if (!cancelled) {
          setCollegeChecking(false);
          setCollegeStatus({
            checked: true,
            approved: false,
            domain: dom,
            message: "Doubtster is not in your college yet",
          });
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email, isStudent]);

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
      setNote({
        text: `Demo mode: Google sign in would go to ${AUTH.GOOGLE_URL} now. Set NEXT_PUBLIC_DEMO=false in production.`,
        kind: "info",
      });
      return;
    }
    window.location.href = AUTH.GOOGLE_URL + (q ? "?q=" + encodeURIComponent(q) : "");
  };

  const validate = () => {
    const e: typeof errs = {};
    if (!emailRe.test(email.trim())) e.em = isStudent ? "Enter a valid university email address." : "Enter a valid email address.";
    if (mode === "signup") {
      if (pw.length < 8) e.pw = "Password is too short (min 8 characters).";
    } else if (!pw) {
      e.pw = "Enter your password.";
    }
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

    if (isStudent && collegeStatus && !collegeStatus.approved) {
      setNote({
        text: "Doubtster is not in your college yet. Please use a regular account or switch off the student option.",
        kind: "bad",
      });
      return;
    }

    setBusy(true);
    const body: Record<string, unknown> = {
      email: email.trim(),
      password: pw,
      isStudent,
    };
    if (mode === "signup") {
      body.name = name.trim();
      body.ageOk = true;
    }
    if (q) body.q = q;

    if (AUTH.DEMO) {
      setTimeout(() => {
        setBusy(false);
        setNote({
          text: `Demo mode: this form would send to ${c.endpoint}. Set NEXT_PUBLIC_DEMO=false in .env.local.`,
          kind: "info",
        });
      }, 700);
      return;
    }

    try {
      const r = await fetch(c.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      setBusy(false);

      if (r.ok) {
        if (j.requireOtp) {
          // Supabase requires email verification via 6-digit OTP
          setOtpEmail(email.trim());
          setOtpType(mode === "signup" ? "signup" : "email");
          setOtpCountdown(45);
          setOtpNote({
            text: j.message || `We sent a 6-digit verification code to ${email.trim()}.`,
            kind: "good",
          });
          setView("otp");
          setTimeout(() => otpRef.current?.focus(), 100);
        } else {
          window.location.href = AUTH.AFTER;
        }
      } else {
        if (j.requireOtp) {
          // Unconfirmed email on login -> go to OTP
          setOtpEmail(email.trim());
          setOtpType("email");
          setOtpCountdown(45);
          setOtpNote({
            text: j.error || "Please verify your email address.",
            kind: "info",
          });
          setView("otp");
          setTimeout(() => otpRef.current?.focus(), 100);
        } else {
          setNote({
            text: j.error || "Something went wrong. Please check your details and try again.",
            kind: "bad",
          });
        }
      }
    } catch {
      setBusy(false);
      setNote({
        text: "Could not reach the server. Check your connection and try again.",
        kind: "bad",
      });
    }
  };

  // Passwordless Email OTP Login
  const startEmailOtpLogin = async () => {
    const clean = email.trim();
    if (!emailRe.test(clean)) {
      setErrs({ em: "Enter your email address first to get a code." });
      emRef.current?.focus();
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const r = await fetch(AUTH.SEND_OTP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, type: "login", isStudent }),
      });
      const j = await r.json().catch(() => ({}));
      setBusy(false);
      if (r.ok) {
        setOtpEmail(clean);
        setOtpType("email");
        setOtpCountdown(45);
        setOtpNote({ text: j.message || `6-digit verification code sent to ${clean}.`, kind: "good" });
        setView("otp");
        setTimeout(() => otpRef.current?.focus(), 100);
      } else {
        setNote({ text: j.error || "Could not send verification code.", kind: "bad" });
      }
    } catch {
      setBusy(false);
      setNote({ text: "Network error sending verification code.", kind: "bad" });
    }
  };

  // Submit 6-digit OTP verification
  const submitOtp = async (ev: FormEvent) => {
    ev.preventDefault();
    const cleanCode = otpCode.trim().replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      setOtpNote({ text: "Please enter the complete 6-digit code from your email.", kind: "bad" });
      otpRef.current?.focus();
      return;
    }

    setOtpBusy(true);
    setOtpNote(null);
    try {
      const r = await fetch(AUTH.VERIFY_OTP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpEmail,
          token: cleanCode,
          type: otpType,
          isStudent,
          name: name.trim(),
        }),
      });
      const j = await r.json().catch(() => ({}));
      setOtpBusy(false);

      if (r.ok) {
        setOtpNote({ text: "Code verified! Redirecting to Doubtster...", kind: "good" });
        setTimeout(() => {
          window.location.href = AUTH.AFTER;
        }, 600);
      } else {
        setOtpNote({
          text: j.error || "Invalid or expired verification code. Try again or resend.",
          kind: "bad",
        });
      }
    } catch {
      setOtpBusy(false);
      setOtpNote({ text: "Could not reach the server. Check your connection.", kind: "bad" });
    }
  };

  // Resend OTP code
  const resendOtp = async () => {
    if (otpCountdown > 0 || !otpEmail) return;
    setOtpBusy(true);
    try {
      const r = await fetch(AUTH.SEND_OTP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, type: otpType, isStudent }),
      });
      const j = await r.json().catch(() => ({}));
      setOtpBusy(false);
      if (r.ok) {
        setOtpCountdown(45);
        setOtpNote({ text: `New 6-digit verification code sent to ${otpEmail}.`, kind: "good" });
      } else {
        setOtpNote({ text: j.error || "Failed to resend verification code.", kind: "bad" });
      }
    } catch {
      setOtpBusy(false);
      setOtpNote({ text: "Failed to resend. Please check your connection.", kind: "bad" });
    }
  };

  const submitReset = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = rem.trim();
    if (!emailRe.test(e)) {
      setRemErr("Enter a valid email address.");
      remRef.current?.focus();
      return;
    }
    setRemErr("");
    if (AUTH.DEMO) {
      setRnote({
        text: `Demo mode: this would send a reset link to ${e} via ${AUTH.RESET_ENDPOINT}. Nothing was sent.`,
        kind: "info",
      });
      return;
    }
    const ok = () =>
      setRnote({
        text: `If an account exists for ${e}, a reset link is on its way. Check your spam folder too.`,
        kind: "good",
      });
    fetch(AUTH.RESET_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: e }),
    }).then(ok, ok);
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
            <div className="tb"><i /><i /><i /><em>{view === "otp" ? "verify-email.app" : c.file}</em></div>
            <div className="bd">
              <div className="in2">
                <div className="mk">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/doubtster-icon.svg" alt="Doubtster" />
                </div>

                {/* VIEW 1: Main Login / Signup Form */}
                <div className="view" hidden={view !== "main"}>
                  <h1>{c.h1}</h1>
                  <p className="lead">{c.lead}</p>
                  {q && (
                    <div className="ask">
                      <span aria-hidden="true">?</span>
                      <span><b>Your question:</b> <span>{q}</span></span>
                    </div>
                  )}

                  {/* Student toggle selector */}
                  <div className="student-seg" role="radiogroup" aria-label="Account type">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!isStudent}
                      className={`student-btn ${!isStudent ? "active" : ""}`}
                      onClick={() => setIsStudent(false)}
                    >
                      <span>Regular Account</span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isStudent}
                      className={`student-btn ${isStudent ? "active" : ""}`}
                      onClick={() => setIsStudent(true)}
                    >
                      <span>🎓 Student</span>
                      <span className="badge">College Perks</span>
                    </button>
                  </div>

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

                  <div className="or"><span>or use your {isStudent ? "university email" : "email"}</span></div>

                  <form className="f" onSubmit={submit} noValidate>
                    {mode === "signup" && (
                      <div className="fld">
                        <label htmlFor="nm">
                          <span>Name <span style={{ color: "var(--mute)", fontWeight: 400 }}>(optional)</span></span>
                        </label>
                        <div className="ip">
                          <input
                            id="nm"
                            type="text"
                            autoComplete="given-name"
                            maxLength={60}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="fld">
                      <label htmlFor="em">
                        <span>{isStudent ? "University Email" : "Email"}</span>
                        {isStudent && <span style={{ fontSize: 11.5, color: "var(--blue)", fontWeight: 500 }}>Approved campus domains only</span>}
                      </label>
                      <div className="ip">
                        <input
                          id="em"
                          ref={emRef}
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          required
                          placeholder={isStudent ? "you@university.edu" : "name@example.com"}
                          aria-describedby="emErr"
                          aria-invalid={errs.em ? "true" : "false"}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errs.em) setErrs((x) => ({ ...x, em: "" }));
                          }}
                        />
                      </div>
                      <p className="err" id="emErr" role="alert">{errs.em}</p>

                      {/* College domain verification feedback */}
                      {isStudent && email.includes("@") && (
                        <>
                          {collegeChecking && (
                            <p className="mt" style={{ color: "var(--blue)" }}>Checking university partner status...</p>
                          )}
                          {!collegeChecking && collegeStatus && (
                            <>
                              {collegeStatus.approved ? (
                                <div className="college-banner good" role="status">
                                  <div className="college-banner-title">
                                    <span>🎓</span> Matched {collegeStatus.college?.name || "Partner University"}!
                                  </div>
                                  <div>
                                    +{collegeStatus.college?.credits || 10} free AI Doubtster credits and student campus privileges included.
                                  </div>
                                </div>
                              ) : (
                                <div className="college-banner bad" role="alert">
                                  <div className="college-banner-title">
                                    <span>⚠️</span> Doubtster is not in your college yet
                                  </div>
                                  <div>
                                    Your campus domain (<strong>@{collegeStatus.domain}</strong>) has not been activated on Doubtster yet.
                                  </div>
                                  <button
                                    type="button"
                                    className="college-switch-btn"
                                    onClick={() => {
                                      setIsStudent(false);
                                      setCollegeStatus(null);
                                    }}
                                  >
                                    Switch to Regular Account
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <div className="fld">
                      <label htmlFor="pw">
                        <span>Password</span>
                        {mode === "login" && (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setRem(email);
                              setView("reset");
                              setTimeout(() => remRef.current?.focus(), 0);
                            }}
                          >
                            Forgot password?
                          </a>
                        )}
                      </label>
                      <div className="ip">
                        <input
                          id="pw"
                          ref={pwRef}
                          type={showPw ? "text" : "password"}
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
                          required
                          aria-describedby="pwErr"
                          aria-invalid={errs.pw ? "true" : "false"}
                          style={{ paddingRight: 64 }}
                          value={pw}
                          onChange={(e) => {
                            setPw(e.target.value);
                            if (errs.pw) setErrs((x) => ({ ...x, pw: "" }));
                          }}
                        />
                        <button
                          className="eye"
                          type="button"
                          aria-pressed={showPw}
                          aria-label="Show or hide password"
                          onClick={() => setShowPw((s) => !s)}
                        >
                          {showPw ? "Hide" : "Show"}
                        </button>
                      </div>

                      {mode === "signup" && (
                        <>
                          <div className="meter" aria-hidden="true">
                            {[0, 1, 2, 3].map((k) => (
                              <i
                                key={k}
                                style={{
                                  background: k < strength ? METER[strength - 1] : undefined,
                                }}
                              />
                            ))}
                          </div>
                          <p className="mt">
                            {pw ? LAB[strength] + (pw.length < 8 ? " (use at least 8 characters)" : "") : "Use at least 8 characters."}
                          </p>
                        </>
                      )}
                      <p className="err" id="pwErr" role="alert">{errs.pw}</p>
                    </div>

                    {mode === "signup" && (
                      <div>
                        <label className="chk">
                          <input
                            id="agree"
                            ref={agreeRef}
                            type="checkbox"
                            checked={agree}
                            onChange={(e) => setAgree(e.target.checked)}
                            aria-describedby="agreeErr"
                          />
                          <span>
                            I am at least 16 (or have a parent or guardian&apos;s permission) and I agree to the{" "}
                            <a href={site("/terms")}>Terms</a> and <a href={site("/privacy")}>Privacy Policy</a>.
                          </span>
                        </label>
                        <p className="err" id="agreeErr" role="alert">{errs.agree}</p>
                      </div>
                    )}

                    <button
                      className={`go2${busy ? " load" : ""}`}
                      type="submit"
                      disabled={busy || (isStudent && collegeStatus !== null && !collegeStatus.approved)}
                    >
                      <span className="spin" aria-hidden="true" />
                      <span>{c.submit}</span>
                    </button>
                  </form>

                  {/* Passwordless Email OTP alternative for Login */}
                  {mode === "login" && (
                    <div className="alt-auth">
                      <button type="button" onClick={startEmailOtpLogin} disabled={busy}>
                        📧 Or sign in with a 6-digit email code
                      </button>
                    </div>
                  )}

                  <p className="sw">
                    {mode === "signup" ? (
                      <>Already have an account? <Link href={"/login" + carry}>Log in</Link></>
                    ) : (
                      <>New to Doubtster? <Link href={"/signup" + carry}>Create a free account</Link></>
                    )}
                  </p>

                  {mode === "signup" && (
                    <div className="perks">
                      <span>Free chat</span>
                      <span>Notes & flashcards</span>
                      <span>Quizzes</span>
                      {isStudent && <span style={{ background: "#E8F0FE", color: "#1A54CC", fontWeight: 600 }}>🎓 University credits</span>}
                      <span>Videos with trial</span>
                    </div>
                  )}
                </div>

                {/* VIEW 2: Email OTP Verification Element */}
                <div className="view" hidden={view !== "otp"}>
                  <a
                    className="back"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setView("main");
                      setOtpCode("");
                      setOtpNote(null);
                      setTimeout(() => emRef.current?.focus(), 50);
                    }}
                  >
                    &larr; Back to {mode === "signup" ? "sign up" : "log in"}
                  </a>

                  <div className="otp-hero">
                    <div className="otp-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <h1>Verify your email</h1>
                    <p className="otp-lead">
                      We sent a 6-digit verification code to <span className="otp-email">{otpEmail}</span>.
                    </p>
                  </div>

                  {otpNote && <div className={`msg ${otpNote.kind}`} role="alert">{otpNote.text}</div>}

                  <form className="f" onSubmit={submitOtp} noValidate>
                    <div className="otp-input-wrap">
                      <label htmlFor="otp-input" className="sr">Enter 6-digit verification code</label>
                      <input
                        id="otp-input"
                        ref={otpRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="000000"
                        className="otp-code-input"
                        value={otpCode}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtpCode(v);
                        }}
                      />
                    </div>

                    <button className={`go2${otpBusy ? " load" : ""}`} type="submit" disabled={otpBusy || otpCode.length !== 6}>
                      <span className="spin" aria-hidden="true" />
                      <span>Verify and continue</span>
                    </button>

                    <div className="otp-actions">
                      <span>Didn&apos;t get the code?</span>
                      <button
                        type="button"
                        className="otp-resend"
                        onClick={resendOtp}
                        disabled={otpCountdown > 0 || otpBusy}
                      >
                        {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend code"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* VIEW 3: Password Reset */}
                {mode === "login" && (
                  <div className="view" hidden={view !== "reset"}>
                    <a
                      className="back"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setView("main");
                        setTimeout(() => emRef.current?.focus(), 0);
                      }}
                    >
                      &larr; Back to log in
                    </a>
                    <h1>Reset your password</h1>
                    <p className="lead">Enter your email and we will send you a link to choose a new one.</p>
                    {rnote && <div className={`msg ${rnote.kind}`} role="status">{rnote.text}</div>}
                    <form className="f" onSubmit={submitReset} noValidate>
                      <div className="fld">
                        <label htmlFor="rem">Email</label>
                        <div className="ip">
                          <input
                            id="rem"
                            ref={remRef}
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            aria-describedby="remErr"
                            aria-invalid={remErr ? "true" : "false"}
                            value={rem}
                            onChange={(e) => setRem(e.target.value)}
                          />
                        </div>
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
