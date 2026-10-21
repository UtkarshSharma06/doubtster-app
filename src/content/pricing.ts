// Single source of truth for every price quoted in blog content.
// Keep in sync with your pricing page, /terms and /refund-policy.
export const PRICING = {
  trialPrice: 1.99,
  trialDays: 7,
  trialVideos: 3,
  monthly: 7.99,
  annual: 59,
  monthlyCredits: 30,
  topups: [
    { credits: 10, price: 4.99 },
    { credits: 25, price: 9.99 },
  ],
  topupValidDays: 90,
} as const;

export const usd = (n: number) => `$${n.toFixed(2)}`;
export const usdTrim = (n: number) => (Number.isInteger(n) ? `$${n}` : usd(n));
export const perVideo = {
  monthly: PRICING.monthly / PRICING.monthlyCredits, // ~0.27
  annual: PRICING.annual / 12 / PRICING.monthlyCredits, // ~0.16
};

/** Cancel-calculator maths, shared by the UI and tests. */
export function trialOutcome(plan: "monthly" | "annual", day: number) {
  const charge = plan === "monthly" ? PRICING.monthly : PRICING.annual;
  if (day <= 5) return { tone: "good" as const, total: PRICING.trialPrice, charge: 0, videos: PRICING.trialVideos };
  if (day === 6) return { tone: "warn" as const, total: PRICING.trialPrice, charge: 0, videos: PRICING.trialVideos };
  return { tone: "bad" as const, total: +(PRICING.trialPrice + charge).toFixed(2), charge, videos: PRICING.trialVideos };
}
