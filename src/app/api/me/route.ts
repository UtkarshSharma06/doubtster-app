import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/subscriptionDb';
import { isPlanActive } from '@/lib/planGuard';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        trialUsed: false,
        authenticated: false,
        plan: null,
        credits: 0,
      });
    }

    // Check user's app_state in Supabase
    let state: any = null;
    const { data: stateData } = await supabase
      .from('app_state')
      .select('state')
      .eq('user_id', user.id)
      .maybeSingle();

    if (stateData?.state) {
      state = stateData.state;
    }

    // Merge any pending webhook update if present
    const pending = db.getPendingUpdate(user.id, user.email || undefined);
    if (pending) {
      if (!state) state = {};
      if (pending.plan !== undefined) state.plan = pending.plan;
      if (pending.pcredits !== undefined) state.pcredits = pending.pcredits;
      if (pending.trialUsed !== undefined) state.trialUsed = pending.trialUsed;
    }

    // Reconcile with Dodo if DB has no active plan
    if (!isPlanActive(state?.plan) && process.env.DODO_PAYMENTS_API_KEY && user.email) {
      try {
        const { dodo, PLAN_CREDITS } = await import('@/lib/dodo');
        const custRes = await dodo.customers.list({ email: user.email });
        const custItems = custRes.items || [];
        for (const cust of custItems) {
          if (!cust.customer_id) continue;
          const dodoSubs = await dodo.subscriptions.list({ customer_id: cust.customer_id });
          const subsList = dodoSubs.items || [];
          const activeSub = subsList.find(
            (s: any) => s.status === 'active' || s.status === 'on_hold'
          );
          if (activeSub) {
            const now = Date.now();
            const isTrial = (activeSub.trial_period_days ?? 0) > 0 || activeSub.metadata?.mode === 'trial';
            const renewTime = activeSub.next_billing_date
              ? new Date(activeSub.next_billing_date).getTime()
              : now + (isTrial ? 7 : (activeSub.metadata?.plan === 'annual' ? 365 : 30)) * 86400000;

            if (!state) state = {};
            state.plan = {
              kind: isTrial ? 'trial' : (activeSub.metadata?.plan || 'monthly'),
              next: activeSub.metadata?.plan || 'monthly',
              start: activeSub.created_at ? new Date(activeSub.created_at).getTime() : now,
              renewAt: renewTime,
              cancelled: false,
              subId: activeSub.subscription_id,
              status: 'active',
            };
            state.pcredits = Math.max(state.pcredits || 0, PLAN_CREDITS);
            state.trialUsed = true;

            await supabase.from('app_state').upsert(
              {
                user_id: user.id,
                state,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );
            break;
          }
        }
      } catch (err: any) {
        console.warn('[/api/me] Dodo auto-sync check error:', err?.message);
      }
    }

    const trialUsed = Boolean(
      state?.trialUsed || (state?.plan && state.plan.kind === 'trial')
    );
    const plan = state?.plan || null;
    const now = Date.now();
    const topups = Array.isArray(state?.topups)
      ? state.topups.filter((t: any) => t.exp > now && t.n > 0)
      : [];
    const topupCredits = topups.reduce((a: number, b: any) => a + (b.n || 0), 0);
    const credits = (state?.pcredits || 0) + topupCredits;

    // Extract display name from auth user metadata
    const meta = (user.user_metadata || {}) as Record<string, string>;
    const fullName: string =
      meta.full_name ||
      meta.name ||
      meta.display_name ||
      '';
    const firstName: string =
      meta.first_name ||
      (fullName ? fullName.split(' ')[0] : '') ||
      (user.email ? user.email.split('@')[0] : '');

    const initial = (firstName || fullName || user.email || 'U').trim().charAt(0).toUpperCase();
    const hasPlan = isPlanActive(plan);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: fullName,
      first_name: firstName,
      initial: initial || 'U',
      has_plan: hasPlan,
      trialUsed,
      plan,
      credits,
      authenticated: true,
    });
  } catch (err: any) {
    console.error('Error in /api/me:', err);
    return NextResponse.json({
      trialUsed: false,
      authenticated: false,
      plan: null,
      credits: 0,
    });
  }
}
