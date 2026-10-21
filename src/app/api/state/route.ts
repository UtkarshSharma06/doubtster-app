import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/subscriptionDb';
import { isPlanActive } from '@/lib/planGuard';
import { dodo, PLAN_CREDITS, PACK_CREDITS } from '@/lib/dodo';

function mergeById(existingArr: any[] = [], incomingArr: any[] = []): any[] {
  const map = new Map<string, any>();
  if (Array.isArray(existingArr)) {
    for (const item of existingArr) {
      if (item && item.id) map.set(item.id, item);
      else if (item) map.set(JSON.stringify(item), item);
    }
  }
  if (Array.isArray(incomingArr)) {
    for (const item of incomingArr) {
      if (item && item.id) {
        const prev = map.get(item.id);
        if (!prev) {
          map.set(item.id, item);
        } else {
          // If incoming is newer or has equal/more content, keep incoming
          const prevLen = JSON.stringify(prev).length;
          const incLen = JSON.stringify(item).length;
          if ((item.ts || 0) >= (prev.ts || 0) || incLen >= prevLen) {
            map.set(item.id, item);
          }
        }
      } else if (item) {
        map.set(JSON.stringify(item), item);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('app_state')
      .select('state')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let state = data?.state || null;

    // Check if there are any pending updates from Dodo webhooks
    const pending = db.getPendingUpdate(user.id, user.email || undefined);
    if (pending) {
      if (!state) state = {};
      if (pending.plan !== undefined) state.plan = pending.plan;
      if (pending.pcredits !== undefined) state.pcredits = pending.pcredits;
      if (pending.trialUsed !== undefined) state.trialUsed = pending.trialUsed;
      if (pending.topup) {
        if (!Array.isArray(state.topups)) state.topups = [];
        state.topups.push(pending.topup);
      }

      // Persist merged state using the authenticated user's session
      await supabase.from('app_state').upsert(
        {
          user_id: user.id,
          state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      db.clearPendingUpdate(user.id, user.email || undefined);
    }

    // Direct Dodo Payments reconciliation: If user has no active plan in DB, verify directly with Dodo
    if (!isPlanActive(state?.plan) && process.env.DODO_PAYMENTS_API_KEY && user.email) {
      try {
        const custRes = await dodo.customers.list({ email: user.email });
        const custItems = custRes.items || [];
        let reconciled = false;

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
            reconciled = true;
            break;
          }
        }

        if (!reconciled) {
          // Check for successful top-up payments
          for (const cust of custItems) {
            if (!cust.customer_id) continue;
            const dodoPayments = await dodo.payments.list({ customer_id: cust.customer_id });
            const paymentsList = dodoPayments.items || [];
            const topupPayment = paymentsList.find(
              (p: any) => p.status === 'succeeded' && p.metadata?.mode === 'topup'
            );
            if (topupPayment) {
              if (!state) state = {};
              if (!Array.isArray(state.topups)) state.topups = [];
              const alreadyHas = state.topups.some((t: any) => t.paymentId === topupPayment.payment_id);
              if (!alreadyHas) {
                const packCredits = PACK_CREDITS[Number(topupPayment.metadata?.pack)] || 10;
                state.topups.push({
                  n: packCredits,
                  exp: new Date(topupPayment.created_at).getTime() + 90 * 86400000,
                  paymentId: topupPayment.payment_id,
                });
                await supabase.from('app_state').upsert(
                  {
                    user_id: user.id,
                    state,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: 'user_id' }
                );
              }
              break;
            }
          }
        }
      } catch (dodoSyncErr: any) {
        console.warn('[Dodo Auto-Sync] Query failed:', dodoSyncErr?.message);
      }
    }

    // Build personalized display name and initial from auth metadata
    const meta = (user.user_metadata || {}) as Record<string, string>;
    const fullName: string =
      meta.full_name || meta.name || meta.display_name || '';
    const firstName: string =
      meta.first_name ||
      (fullName ? fullName.split(' ')[0] : '') ||
      (user.email ? user.email.split('@')[0] : '');

    const displayName = firstName || fullName || user.email?.split('@')[0] || '';
    const initial = (firstName || fullName || user.email || 'U').trim().charAt(0).toUpperCase();
    const hasPlan = isPlanActive(state?.plan);

    return NextResponse.json({
      state,
      user_name: displayName,
      email: user.email || '',
      initial: initial || 'U',
      has_plan: hasPlan,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { state } = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load existing state from Supabase to prevent wiping user data from other devices
    const { data: existingData } = await supabase
      .from('app_state')
      .select('state')
      .eq('user_id', user.id)
      .maybeSingle();

    const existingState = existingData?.state || {};
    const finalState = { ...state };

    // Deep merge collections by ID so chats, notes, decks, videos, and quizzes are never wiped
    finalState.chats = mergeById(existingState.chats, state?.chats);
    finalState.notes = mergeById(existingState.notes, state?.notes);
    finalState.decks = mergeById(existingState.decks, state?.decks);
    finalState.videos = mergeById(existingState.videos, state?.videos);
    finalState.quizzes = mergeById(existingState.quizzes, state?.quizzes);
    finalState.tasks = mergeById(existingState.tasks, state?.tasks);
    finalState.saved = mergeById(existingState.saved, state?.saved);

    // Merge profile safely
    finalState.profile = {
      ...(existingState.profile || {}),
      ...(state?.profile || {}),
    };
    if (!finalState.profile.name || finalState.profile.name === 'You') {
      if (existingState.profile?.name && existingState.profile.name !== 'You') {
        finalState.profile.name = existingState.profile.name;
      }
    }

    // Protect subscription plan and credits from being wiped by stale client-side saves
    if (isPlanActive(existingState?.plan)) {
      finalState.plan = existingState.plan;
      finalState.pcredits = Math.max(existingState.pcredits || 0, finalState.pcredits || 0);
      finalState.trialUsed = existingState.trialUsed || finalState.trialUsed;
    } else if (existingState?.plan && !finalState.plan) {
      finalState.plan = existingState.plan;
    }
    if (existingState?.trialUsed && !finalState.trialUsed) {
      finalState.trialUsed = true;
    }
    if ((existingState?.pcredits || 0) > (finalState.pcredits || 0) && !finalState.spent) {
      finalState.pcredits = existingState.pcredits;
    }
    if (Array.isArray(existingState?.topups) && existingState.topups.length > (finalState.topups?.length || 0)) {
      finalState.topups = existingState.topups;
    }

    // Merge any pending webhook update
    const pending = db.getPendingUpdate(user.id, user.email || undefined);
    if (pending) {
      if (pending.plan !== undefined) finalState.plan = pending.plan;
      if (pending.pcredits !== undefined) finalState.pcredits = pending.pcredits;
      if (pending.trialUsed !== undefined) finalState.trialUsed = pending.trialUsed;
      if (pending.topup) {
        if (!Array.isArray(finalState.topups)) finalState.topups = [];
        finalState.topups.push(pending.topup);
      }
      db.clearPendingUpdate(user.id, user.email || undefined);
    }

    const { error } = await supabase.from('app_state').upsert(
      {
        user_id: user.id,
        state: finalState,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, state: finalState });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
