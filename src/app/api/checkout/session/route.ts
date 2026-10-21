import { NextResponse } from 'next/server';
import { dodo, PRODUCT, TRIAL_DAYS } from '@/lib/dodo';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { mode, plan, pack, email } = await req.json();

    let userId = 'guest';
    let userEmail = String(email || '');

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email || userEmail;
      }
    } catch {}

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
    const cart =
      mode === 'topup'
        ? [{ product_id: PRODUCT.packs[Number(pack)], quantity: 1 }]
        : mode === 'trial'
        ? [{ product_id: PRODUCT[plan as 'monthly' | 'annual'], quantity: 1 }, { product_id: PRODUCT.trialFee, quantity: 1 }]
        : [{ product_id: PRODUCT[plan as 'monthly' | 'annual'], quantity: 1 }];

    const session = await dodo.checkoutSessions.create({
      product_cart: cart,
      customer: { email: userEmail },
      return_url: `${base}/app?checkout=return`,
      metadata: { user_id: userId, mode, plan: plan ?? '', pack: String(pack ?? '') },
      ...({ theme: 'light' } as any),
      theme_config: {
        light: {
          bg_primary: '#ffffff',
          bg_secondary: '#f9fafb',
          border_primary: '#e5e7eb',
          button_primary: '#1B57C8',
          button_primary_hover: '#1545A3',
          text_primary: '#111827',
          text_secondary: '#4b5563',
        },
        dark: {
          bg_primary: '#ffffff',
          bg_secondary: '#f9fafb',
          border_primary: '#e5e7eb',
          button_primary: '#1B57C8',
          button_primary_hover: '#1545A3',
          text_primary: '#111827',
          text_secondary: '#4b5563',
        },
      },
      ...(mode === 'trial' ? { subscription_data: { trial_period_days: TRIAL_DAYS } } : {}),
    });

    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (err: any) {
    console.error('Checkout session error:', err);
    return NextResponse.json({ error: err.message || 'Checkout session failed' }, { status: 500 });
  }
}
