/** Safe to import from client components (no node APIs). */
export type LegalKey = "terms" | "privacy" | "refund-policy";

export const LEGAL_ORDER: LegalKey[] = ["terms", "privacy", "refund-policy"];

export const LEGAL: Record<LegalKey, { title: string; word: string; sub: string; fname: string; desc: string }> = {
  terms: {
    title: "Terms and Conditions",
    word: "terms",
    sub: "the rules for using Doubtster, in plain words where we can",
    fname: "terms.md",
    desc: "The terms that apply when you use Doubtster: plans, trials, credits, payments, AI content and your rights.",
  },
  privacy: {
    title: "Privacy Policy",
    word: "privacy",
    sub: "what we collect, why, who sees it, and what you can do about it",
    fname: "privacy.md",
    desc: "How Doubtster collects, uses and protects your personal data, and the choices you have.",
  },
  "refund-policy": {
    title: "Cancellation and Refund Policy",
    word: "refunds",
    sub: "how to cancel, when you are charged, and when we refund",
    fname: "refund-policy.md",
    desc: "How cancellation and refunds work for Doubtster trials, plans and top-ups.",
  },
};

