# Doubtster app (Next.js)

The product side of Doubtster: login, signup, onboarding and the app. The marketing site, blog and legal pages live in the other project (`doubtster-web`); set `NEXT_PUBLIC_MARKETING_URL` to link to it.

## Run
    npm install
    npm run dev        # http://localhost:3000  (redirects to /app)
    npm run build && npm start

## Routes
| Route | What it is |
|---|---|
| `/login`, `/signup` | `src/components/auth/AuthPage.tsx`. Google button, email form, strength meter, password reset view, carries `?q=` through |
| `/onboarding` | `src/components/onboarding/Onboarding.tsx`. Level, subjects, goals, name and style. Saved in the browser, read by the app |
| `/app` | Home dashboard, Ask (chat), Flashcards (spaced repetition), Quizzes, Videos, Notes, Planner, Library, Account and billing. Sections switch with `#home`, `#chat`, `#flash` and so on. Ctrl K opens a command palette |

## How the app is built
`/app` renders a static React shell (`AppShell.tsx`). The views are painted by `src/lib/appEngine.ts`, which is the prototype's logic ported as is and kept as a `@ts-nocheck` module. It stores state in `localStorage` and cleans up all listeners and timers on unmount. Converting views to React components later is straightforward, one view at a time.

## What every reply can do
Under every reply there are three buttons: **Video** (asks for 2 min or 5 min), **Flashcards** and **Quiz**. Flashcards and quizzes are free. A 2 min video costs 1 credit, a 5 min video costs 2 (`PRICE.videoCost`).

**Demo player** (free, all in the browser): every step is shown with a "why it works" explanation, animated graphs are drawn where one fits (lines, curves, bars, with the answer marked), a 5 min video adds a plan, common mistakes, a recap and a practice prompt. English and Hindi (Kalam font for Devanagari), voice-over from the device's own voices (en-IN, hi-IN, depends on what is installed), captions, chapters, speed, fullscreen and keyboard shortcuts. "Save as video file" records the player to a silent WebM in real time. Hindi in demo mode covers the built-in topics and templated problems; for any topic or language your `/api/video` endpoint receives `lang` and does the writing.

## Popups
- **Pro trial popup** (landing-page look with a 3D tilting preview): shown once per session to people with no plan, and whenever they press Video without a plan. Offers the $1.99 trial, with the auto-renew and no-refund wording.
- **Buy credits popup**: shown to people on a plan (trial included) when credits hit 0, once per session on load, and whenever a video needs more credits than they have. Offers the 10 and 25 credit packs, and a "make the 2 min version instead" shortcut when a 5 min video is one credit short.

## Demo mode
Everything is in labelled demo mode while `NEXT_PUBLIC_DEMO` is not `false`:
- Chat uses a small built-in engine (linear equations, percentage change, speed-up-from-rest problems, basic sums and a few topics).
- Video is a board animation built from the answer steps, with no rendered file.
- Checkout takes no payment. Trial, plan, credits, top-ups, cancel and 7-day conversion are simulated. Account has "demo tools" to move time forward.
- Auth and onboarding forms validate, then show what they would send.

## Connect your backend
Config lives in `src/lib/config.ts`. The `src/app/api/*` route handlers are 501 stubs that document the request and response shape of each endpoint: `chat`, `video` (now gets `minutes` and `voice`), `deck` (new, optional), `checkout`, `onboarding`, `auth/signup`, `auth/login`, `auth/reset`. Also add a `/auth/google` route that starts Google OAuth. Then set `NEXT_PUBLIC_DEMO=false`.

Credits, plan state and billing are enforced in the browser in the prototype. Move them server side before taking real payments.

## Prices
Defined once at the top of `appEngine.ts` (`PRICE`): trial $1.99 for 7 days and 3 credits, 2 min video 1 credit, 5 min video 2 credits, Monthly $7.99, Yearly $59, 30 credits a month, top-ups 10 for $4.99 and 25 for $9.99 valid 90 days. Keep in sync with your pricing page and refund policy.

## Before launch
- Replace `[SUPPORT EMAIL]` in `config.ts`.
- Decide whether top-ups need an active plan (the demo allows them for anyone).
