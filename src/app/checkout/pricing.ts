/* Display only. The real prices live in Dodo and on your server (lib/dodo.ts). Keep these in sync. */
export const PRICE = {
  trial: 1.99,
  monthly: 7.99,
  annual: 59,
  credits: 30,
  packs: [{ n: 10, p: 4.99 }, { n: 25, p: 9.99 }],
  trialDays: 7,
  trialCredits: 3,
  topupDays: 90,
  videoCost: { 2: 1, 5: 2 },
} as const;

export type Mode = 'trial' | 'direct' | 'topup';
export type Plan = 'monthly' | 'annual';

export const money = (n: number) => '$' + (n >= 10 && n === Math.floor(n) ? String(n) : n.toFixed(2));
export const perMonth = () => money(PRICE.annual / 12);
export const save38 = () => Math.round((1 - PRICE.annual / (PRICE.monthly * 12)) * 100);
