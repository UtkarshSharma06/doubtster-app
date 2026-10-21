import DodoPayments from 'dodopayments';

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || '',
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || '',
  environment: process.env.DODO_ENV === 'live' ? 'live_mode' : 'test_mode',
});

/* Create these 5 products in the Dodo dashboard, then put their ids in .env.local.
   Prices live in Dodo. The browser never sends a price. */
export const PRODUCT = {
  monthly: process.env.DODO_PRODUCT_MONTHLY || '',   // subscription, $7.99, billed every month
  annual: process.env.DODO_PRODUCT_ANNUAL || '',     // subscription, $59, billed every year
  trialFee: process.env.DODO_PRODUCT_TRIAL_FEE || '', // one-time, $1.99
  packs: [process.env.DODO_PRODUCT_PACK_10 || '', process.env.DODO_PRODUCT_PACK_25 || ''], // one-time, $4.99 and $9.99
};
export const PACK_CREDITS = [10, 25];
export const PLAN_CREDITS = 30;
export const TRIAL_CREDITS = 3;
export const TRIAL_DAYS = 7;
export const TOPUP_DAYS = 90;
