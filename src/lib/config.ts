/**
 * One place to connect your backend.
 * Everything runs in labelled DEMO mode until NEXT_PUBLIC_DEMO=false and the endpoints exist.
 * The route handlers under src/app/api are 501 stubs showing the expected request shapes.
 */
export const DEMO = process.env.NEXT_PUBLIC_DEMO !== "false";

/** Your marketing site (landing, blog, legal pages). Main domain is doubtster.com (never localhost) */
const envMarketing = process.env.NEXT_PUBLIC_MARKETING_URL;
export const SITE = (envMarketing && !envMarketing.includes("localhost") ? envMarketing : "https://doubtster.com").replace(/\/$/, "");
export const site = (path: string) => `${SITE}${path.startsWith('/') ? path : `/${path}`}`;

/** The main app domain (always app.doubtster.com in production, never localhost) */
const envApp = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
export const APP_DOMAIN = (envApp && !envApp.includes("localhost") ? envApp : "https://app.doubtster.com").replace(/\/$/, "");

export function getAppOrigin(request?: Request): string {
  if (request) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    if (host && !host.includes("localhost")) {
      return `${proto}://${host}`;
    }
  }
  if (process.env.NODE_ENV === "development" && request) {
    return new URL(request.url).origin;
  }
  return APP_DOMAIN;
}

export const AUTH = {
  GOOGLE_URL: "/api/auth/google", // server route that starts Google OAuth, then redirects back
  SIGNUP_ENDPOINT: "/api/auth/signup", // POST {email,password,name,ageOk,q?} -> 200, or 4xx {error}
  LOGIN_ENDPOINT: "/api/auth/login", // POST {email,password,q?} -> 200, or 4xx {error}
  RESET_ENDPOINT: "/api/auth/reset", // POST {email}
  AFTER: "/app", // where to go after success
  DEMO,
} as const;

export const ONBOARDING = {
  ENDPOINT: "/api/onboarding", // POST {level,subjects,goals,name,style} -> 200
  CHAT_URL: "/app",
  DEMO,
} as const;

export const APP = {
  DEMO,
  CHAT_ENDPOINT: "/api/chat", // POST {messages:[{role,content}],profile,subject,detail:"steps"|"quick"} -> {title,subject,steps:[{h,t,math?,code?}],answer} or {text}
  VIDEO_ENDPOINT: "/api/video", // POST {title,scenes,prompt,minutes:2|5,voice,lang} -> {url}. 2 min costs 1 credit, 5 min costs 2
  DECK_ENDPOINT: "/api/deck", // POST {topic,profile} -> {title,subject,cards:[{f,b}]}
  CHECKOUT_ENDPOINT: "/api/checkout", // POST {mode:'trial'|'direct'|'topup',plan,pack} -> {url}
  ONBOARDING_URL: "/onboarding",
  SITE,
  SUPPORT_EMAIL: "contact@doubtster.com",
};
