'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CheckoutBreakdownData, CheckoutEvent } from 'dodopayments-checkout';
import { PRICE, money, perMonth, save38, type Mode, type Plan } from './pricing';
import { site } from '@/lib/config';
import './checkout.css';

/* ---------- config (set these in .env.local) ---------- */
const DODO_MODE = (process.env.NEXT_PUBLIC_DODO_MODE === 'live' ? 'live' : 'test') as 'live' | 'test';
const APP_URL = '/app';
const LINKS = { terms: site('/terms'), privacy: site('/privacy'), refund: site('/refund-policy') };
const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'contact@doubtster.com';
const SESSION_ENDPOINT = '/api/checkout/session'; // POST {mode,plan,pack} -> {checkout_url}
const ME_ENDPOINT = '/api/me';                    // optional: GET -> {trialUsed:boolean}

const DAY = 86400000;
const ZERO = new Set(['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'UGX', 'XAF', 'XOF', 'PYG', 'RWF']);
const dstr = (t: number) => new Date(t).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
function mny(n: number, cur = 'USD') {
  const z = ZERO.has(cur), v = (n / (z ? 1 : 100)).toFixed(z ? 0 : 2);
  return cur === 'USD' ? '$' + v : cur + ' ' + v;
}

const Check = () => (<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);

export default function CheckoutClient() {
  const router = useRouter();
  const qs = useSearchParams();

  const askedMode = (['trial', 'direct', 'topup'] as const).find((m) => m === qs.get('mode')) ?? 'trial';
  const [plan, setPlan] = useState<Plan>(qs.get('plan') === 'annual' ? 'annual' : 'monthly');
  const pack = qs.get('pack') === '1' ? 1 : 0;
  const [trialUsed, setTrialUsed] = useState(false);
  const mode: Mode = askedMode === 'trial' && trialUsed ? 'direct' : askedMode; // one trial per account

  const [now, setNow] = useState<number | null>(null);          // set after mount so dates never mismatch on hydration
  const [consent, setConsent] = useState(false);
  const [consentBad, setConsentBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [bd, setBd] = useState<CheckoutBreakdownData | null>(null);
  const inited = useRef(false);
  const sdkRef = useRef<typeof import('dodopayments-checkout')['DodoPayments'] | null>(null);

  useEffect(() => { setNow(Date.now()); }, []);
  useEffect(() => {
    fetch(ME_ENDPOINT, { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j && j.trialUsed) setTrialUsed(true); }).catch(() => {});
  }, []);
  useEffect(() => () => { try { sdkRef.current?.Checkout.close(); } catch {} }, []);

  /* keep the URL in step with the chosen plan */
  useEffect(() => {
    const u = new URLSearchParams(qs.toString());
    u.set('mode', mode);
    if (mode === 'topup') u.set('pack', String(pack)); else u.set('plan', plan);
    router.replace('?' + u.toString(), { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, plan, pack]);

  const trialEnd = (now ?? 0) + PRICE.trialDays * DAY;
  const due = mode === 'topup' ? PRICE.packs[pack].p : mode === 'trial' ? PRICE.trial : PRICE[plan];
  const planLabel = plan === 'monthly' ? 'Monthly' : 'Yearly';
  const per = plan === 'monthly' ? 'month' : 'year';
  const thenTxt = plan === 'monthly' ? money(PRICE.monthly) + ' a month' : money(PRICE.annual) + ' a year (' + perMonth() + ' a month)';

  const reset = useCallback(() => {
    try { if (inited.current && sdkRef.current?.Checkout.isOpen()) sdkRef.current.Checkout.close(); } catch {}
    setOpen(false); setReady(false); setBd(null); setConsent(false); setBusy(false);
  }, []);

  const onDodo = useCallback((ev: CheckoutEvent) => {
    const d = (ev.data ?? {}) as Record<string, unknown>;
    if (
      ev.event_type === 'checkout.form_ready' ||
      ev.event_type === 'checkout.opened' ||
      ev.event_type === 'checkout.payment_page_opened' ||
      ev.event_type === 'checkout.resize' ||
      ev.event_type === 'checkout.keys_provided'
    ) {
      setReady(true);
    }
    else if (ev.event_type === 'checkout.breakdown') setBd((d.message as CheckoutBreakdownData) ?? null);
    else if (ev.event_type === 'checkout.error')
      setError(typeof d.message === 'string' && d.message ? d.message : 'Something went wrong with the payment form. Please try again.');
    else if (ev.event_type === 'checkout.link_expired') { reset(); setError('This checkout session expired. Please start again.'); }
  }, [reset]);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!consent) { setConsentBad(true); return; }
    setBusy(true);
    try {
      let emailHint = '';
      try {
        const stored = JSON.parse(localStorage.getItem('doubtster-app-v2') || '{}');
        emailHint = stored?.profile?.email || '';
      } catch {}

      const r = await fetch(SESSION_ENDPOINT, {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, plan, pack, email: emailHint }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.checkout_url) throw new Error(j?.error || '');
      const { DodoPayments } = await import('dodopayments-checkout'); // client only, loaded when needed
      sdkRef.current = DodoPayments;
      if (!inited.current) { DodoPayments.Initialize({ mode: DODO_MODE, displayType: 'inline', onEvent: onDodo }); inited.current = true; }
      setOpen(true); setBusy(false);
      // the container is already in the DOM (hidden attribute is removed on the next paint)
      requestAnimationFrame(() => {
        DodoPayments.Checkout.open({
          checkoutUrl: j.checkout_url,
          elementId: 'dodo-inline-checkout',
          options: {
            showSecurityBadge: true,
            themeConfig: {
              light: {
                bgPrimary: '#ffffff',
                bgSecondary: '#f9fafb',
                borderPrimary: '#e5e7eb',
                buttonPrimary: '#1B57C8',
                buttonTextPrimary: '#ffffff',
                textPrimary: '#111827',
                textSecondary: '#4b5563',
              },
              dark: {
                bgPrimary: '#ffffff',
                bgSecondary: '#f9fafb',
                borderPrimary: '#e5e7eb',
                buttonPrimary: '#1B57C8',
                buttonTextPrimary: '#ffffff',
                textPrimary: '#111827',
                textSecondary: '#4b5563',
              },
            },
          },
        });
        document.getElementById('dodo-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Guard: ensure skeleton bars NEVER stay stuck once iframe appears
        const check = setInterval(() => {
          if (document.querySelector('#dodo-inline-checkout iframe')) {
            setReady(true);
            clearInterval(check);
          }
        }, 120);
        setTimeout(() => {
          setReady(true);
          clearInterval(check);
        }, 1200);
      });
    } catch (err) {
      setBusy(false);
      setError(/already used/.test((err as Error).message)
        ? 'Your free trial was already used. Choose a plan instead.'
        : 'Checkout is unavailable right now. Please try again in a minute.');
    }
  }

  function pickPlan(p: Plan) { if (open) reset(); setPlan(p); setError(''); }

  /* summary rows (mirror Dodo's totals once the form reports them) */
  const cur = bd?.currency ?? 'USD';
  const total = bd ? (bd.finalTotal ?? bd.total) : undefined;
  const totalTxt = total != null ? mny(total, bd?.finalTotalCurrency ?? cur) : money(due);

  const perks = useMemo(() => mode === 'topup'
    ? [`A 2 minute video uses ${PRICE.videoCost[2]} credit, a 5 minute video uses ${PRICE.videoCost[5]}`, 'One payment, no subscription']
    : ['2 or 5 minute board-style videos from any reply', 'Voice-over, chapters and a seek bar', 'Flashcards and a quiz from every video',
       `Top up any time: ${PRICE.packs[0].n} credits ${money(PRICE.packs[0].p)}, ${PRICE.packs[1].n} credits ${money(PRICE.packs[1].p)}`], [mode]);

  const [colOpen, setColOpen] = useState(false);
  const dt = (t: number) => (now ? dstr(t) : '');

  return (
    <div className={'co' + (open ? ' liveopen' : '')}>
      <div className="wrap">
        <aside className="L" aria-label="Order summary"><div className="Li">
          <a className="back" href={APP_URL}><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>Back to Doubtster</a>
          <div className="brand"><img src="/brand/doubtster-logo-dark.svg" alt="Doubtster" /></div>

          <div className="kick">{mode === 'trial' ? 'Start your 7-day trial' : mode === 'direct' ? 'Subscribe to Doubtster Pro' : 'Buy credits'}</div>
          <div className="due"><b>{totalTxt}</b><span>{mode === 'topup' ? 'one time' : 'due today'}</span></div>
          <div className="then" suppressHydrationWarning>
            {mode === 'trial' && <>Then {thenTxt} from {dt(trialEnd)}. Cancel any time before then.</>}
            {mode === 'direct' && <>{plan === 'monthly' ? 'Renews every month' : `Renews every year, ${perMonth()} a month`} until you cancel.</>}
            {mode === 'topup' && <>Valid for {PRICE.topupDays} days. Used after your plan credits.</>}
          </div>

          <button className="sumtog" type="button" aria-expanded={colOpen} aria-controls="col" onClick={() => setColOpen((v) => !v)}>
            <span>Order details</span><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <div className={'collapsible' + (colOpen ? ' open' : '')} id="col">
            {mode !== 'topup' && (
              <div className="seg" role="group" aria-label="Billing period">
                <button type="button" aria-pressed={plan === 'monthly'} onClick={() => pickPlan('monthly')}>Monthly {money(PRICE.monthly)}</button>
                <button type="button" aria-pressed={plan === 'annual'} onClick={() => pickPlan('annual')}>Yearly {money(PRICE.annual)} <em>save {save38()}%</em></button>
              </div>
            )}
            <div className="items">
              {mode === 'trial' && (<>
                <div className="it"><div>Doubtster Pro trial<small>{PRICE.trialDays} days, {PRICE.trialCredits} credits</small></div><b>{money(PRICE.trial)}</b></div>
                <div className="it"><div>Then {planLabel}<small suppressHydrationWarning>Starts {dt(trialEnd)}, renews every {per}</small></div><b>{money(PRICE[plan])}</b></div>
              </>)}
              {mode === 'direct' && (
                <div className="it"><div>Doubtster Pro, {planLabel}<small>{PRICE.credits} credits every month</small></div><b>{money(PRICE[plan])}</b></div>
              )}
              {mode === 'topup' && (
                <div className="it"><div>{PRICE.packs[pack].n} video credits<small>Valid for {PRICE.topupDays} days</small></div><b>{money(PRICE.packs[pack].p)}</b></div>
              )}
              {bd && (bd.discount ?? 0) > 0 && <div className="it"><div>Discount</div><b>-{mny(bd.discount!, cur)}</b></div>}
              {bd && (bd.tax ?? 0) > 0 && <div className="it"><div>Tax</div><b>{mny(bd.tax!, cur)}</b></div>}
              <div className="it tot"><div>Due today</div><b>{totalTxt}</b></div>
            </div>
            <ul className="perks">{perks.map((t) => <li key={t}><i><Check /></i><span>{t}</span></li>)}</ul>
          </div>
          <div className="Lfoot">Chat, flashcards and quizzes stay free. You only pay for videos.</div>
        </div></aside>

        <main className="R"><div className="Ri">
          <h1>Payment details</h1>
          <p className="sub">{mode === 'topup' ? 'You will not be charged again after this.' : 'Secure checkout. You can cancel from your account.'}</p>

          <form onSubmit={start} noValidate>
            <div className={'banner' + (error ? ' on' : '')} role="alert">{error}</div>
            <label className={'chk' + (consentBad ? ' bad' : '')} id="g-cons">
              <input type="checkbox" checked={consent} disabled={open} onChange={(e) => { setConsent(e.target.checked); setConsentBad(false); }} />
              <span suppressHydrationWarning>
                {mode === 'trial' && <>I understand my {planLabel} plan starts automatically on {dt(trialEnd)} and {money(PRICE[plan])} is charged, unless I cancel before then. A charge from forgetting to cancel is not refundable. See the <a href={LINKS.refund} target="_blank" rel="noopener">refund policy</a>.</>}
                {mode === 'direct' && <>I understand this renews automatically every {per} until I cancel, and that payments are not refundable except as described in the <a href={LINKS.refund} target="_blank" rel="noopener">refund policy</a>.</>}
                {mode === 'topup' && <>I understand top-ups are not refundable except as described in the <a href={LINKS.refund} target="_blank" rel="noopener">refund policy</a>.</>}
              </span>
            </label>
            {consentBad && <p className="fine" style={{ color: 'var(--err)' }}>Please tick the box to continue.</p>}
            <button className={'pay' + (busy ? ' busy' : '')} id="pay" type="submit" disabled={busy}>
              <svg className="lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              <span className="txt">Continue to payment</span><i className="spin" />
            </button>
            <div className="trust"><svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg><span>Your card is entered in Dodo Payments&apos; secure form next</span></div>
            <p className="fine" id="fine">By paying you agree to the <a href={LINKS.terms} target="_blank" rel="noopener">Terms</a> and <a href={LINKS.privacy} target="_blank" rel="noopener">Privacy Policy</a>.</p>
          </form>

          <div id="dodo-wrap" hidden={!open}>
            <div className="agreed"><i><Check /></i>You agreed to the terms</div>
            <div id="dodo-inline-checkout" data-dodo-ready={ready ? 'true' : 'false'}>
              {!ready && <div className="skel"><i /><i /><i /><i /><i /></div>}
            </div>
            <button className="again" type="button" onClick={reset}>Change plan or start over</button>
          </div>

          <div className="Rfoot">
            <a href={LINKS.terms}>Terms</a><a href={LINKS.privacy}>Privacy</a><a href={LINKS.refund}>Refund policy</a>
            {SUPPORT && <a href={`mailto:${SUPPORT}`}>Help</a>}
          </div>
        </div></main>
      </div>
    </div>
  );
}
