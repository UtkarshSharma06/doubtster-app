import { NextResponse } from 'next/server';
import { dodo, PRODUCT, TRIAL_DAYS } from '@/lib/dodo';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { mode, plan, pack, email } = await req.json();

    let userId = 'guest';
    let userEmail = String(email || '').trim();
    let userName = 'Student';

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = (user.email || userEmail).trim();
        userName = user.user_metadata?.name || user.user_metadata?.full_name || userName;
      }
    } catch {}

    if (!userEmail) {
      userEmail = 'student@doubtster.com';
    }

    if (!['trial', 'direct', 'topup'].includes(mode)) {
      return NextResponse.json({ error: 'bad mode' }, { status: 400 });
    }
    if (mode !== 'topup' && !['monthly', 'annual'].includes(plan)) {
      return NextResponse.json({ error: 'bad plan' }, { status: 400 });
    }
    if (mode === 'topup' && ![0, 1].includes(Number(pack))) {
      return NextResponse.json({ error: 'bad pack' }, { status: 400 });
    }

    if (!process.env.DODO_PAYMENTS_API_KEY) {
      return NextResponse.json({
        error: "Dodo Payments API Key is not configured yet. Please set DODO_PAYMENTS_API_KEY in .env.local."
      }, { status: 503 });
    }

    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    let checkoutUrl = '';

    // Primary strategy: subscriptions.create (for trial/direct) & payments.create (for topup)
    // These endpoints utilize subscriptions:write and payments:write scopes.
    try {
      if (mode === 'topup') {
        const payment = await dodo.payments.create({
          billing: { country: 'US' },
          customer: { email: userEmail, name: userName },
          product_cart: [{ product_id: PRODUCT.packs[Number(pack)], quantity: 1 }],
          payment_link: true,
          return_url: `${base}/app?checkout=return`,
          metadata: { user_id: userId, mode, plan: plan ?? '', pack: String(pack ?? '') },
        });
        checkoutUrl = payment.payment_link || '';
      } else if (mode === 'trial') {
        const sub = await dodo.subscriptions.create({
          billing: { country: 'US' },
          customer: { email: userEmail, name: userName },
          product_id: PRODUCT[plan as 'monthly' | 'annual'],
          quantity: 1,
          payment_link: true,
          return_url: `${base}/app?checkout=return`,
          trial_period_days: TRIAL_DAYS,
          one_time_product_cart: [{ product_id: PRODUCT.trialFee, quantity: 1 }],
          metadata: { user_id: userId, mode, plan: plan ?? '', pack: String(pack ?? '') },
        });
        checkoutUrl = sub.payment_link || '';
      } else {
        // direct subscription
        const sub = await dodo.subscriptions.create({
          billing: { country: 'US' },
          customer: { email: userEmail, name: userName },
          product_id: PRODUCT[plan as 'monthly' | 'annual'],
          quantity: 1,
          payment_link: true,
          return_url: `${base}/app?checkout=return`,
          metadata: { user_id: userId, mode, plan: plan ?? '', pack: String(pack ?? '') },
        });
        checkoutUrl = sub.payment_link || '';
      }
    } catch (createErr: any) {
      console.warn('subscriptions/payments.create failed, trying checkoutSessions.create fallback:', createErr?.message || createErr);

      // Secondary fallback: checkoutSessions.create
      const cart =
        mode === 'topup'
          ? [{ product_id: PRODUCT.packs[Number(pack)], quantity: 1 }]
          : mode === 'trial'
          ? [{ product_id: PRODUCT[plan as 'monthly' | 'annual'], quantity: 1 }, { product_id: PRODUCT.trialFee, quantity: 1 }]
          : [{ product_id: PRODUCT[plan as 'monthly' | 'annual'], quantity: 1 }];

      const session = await dodo.checkoutSessions.create({
        product_cart: cart,
        customer: { email: userEmail, name: userName },
        return_url: `${base}/app?checkout=return`,
        metadata: { user_id: userId, mode, plan: plan ?? '', pack: String(pack ?? '') },
        ...(mode === 'trial' ? { subscription_data: { trial_period_days: TRIAL_DAYS } } : {}),
      });
      checkoutUrl = session.checkout_url || '';
    }

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ checkout_url: checkoutUrl });
  } catch (err: any) {
    console.error('Checkout session error:', err);
    return NextResponse.json({ error: err.message || 'Checkout session failed' }, { status: 500 });
  }
}
