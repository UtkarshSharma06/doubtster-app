import { NextResponse } from 'next/server';
import { dodo, PLAN_CREDITS, TRIAL_CREDITS, PACK_CREDITS, TOPUP_DAYS } from '@/lib/dodo';
import { db } from '@/lib/subscriptionDb';

const DAY = 86400000;

export async function POST(req: Request) {
  const raw = await req.text(); // must be the raw body, not parsed JSON
  let event: any;

  try {
    if (process.env.DODO_PAYMENTS_WEBHOOK_KEY) {
      event = dodo.webhooks.unwrap(raw, {
        headers: {
          'webhook-id': req.headers.get('webhook-id') as string,
          'webhook-signature': req.headers.get('webhook-signature') as string,
          'webhook-timestamp': req.headers.get('webhook-timestamp') as string,
        },
      });
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.error('[Dodo Webhook] Rejecting: DODO_PAYMENTS_WEBHOOK_KEY is not set in production.');
        return NextResponse.json({ error: 'Webhook key not configured' }, { status: 500 });
      }
      console.warn('[Dodo Webhook] DODO_PAYMENTS_WEBHOOK_KEY not set. Processing in development test mode.');
      event = dodo.webhooks.unsafeUnwrap(raw);
    }
  } catch (err: any) {
    console.error('[Dodo Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const id = req.headers.get('webhook-id') || event.webhook_id || `evt_${Date.now()}`;
  if (await db.webhookSeen(id)) {
    // Dodo retries, so de-duplicate on webhook-id
    return NextResponse.json({ received: true, deduplicated: true });
  }

  const d = event.data ?? {};
  const meta = d.metadata ?? {}; // set when the session was created
  const customerEmail = d.customer?.email || d.customer_email || d.billing?.email;
  const resolvedUserId = await db.resolveUserId(meta.user_id, customerEmail);
  const userId = resolvedUserId || meta.user_id || 'guest';

  console.log(`[Dodo Webhook] Event ${event.type} received for user=${userId} mode=${meta.mode}`);

  switch (event.type) {
    case 'subscription.active': // fires at trial start and at the first paid start
    case 'subscription.created':
      if (meta.mode === 'trial') {
        await db.setPlan(
          userId,
          {
            kind: 'trial',
            next: meta.plan || 'monthly',
            credits: PLAN_CREDITS,
            trialUsed: true,
            renewAt: d.next_billing_date || (Date.now() + 7 * DAY),
            subId: d.subscription_id,
          },
          customerEmail
        );
      } else {
        await db.setPlan(
          userId,
          {
            kind: meta.plan || 'monthly',
            credits: PLAN_CREDITS,
            renewAt: d.next_billing_date || (Date.now() + (meta.plan === 'annual' ? 365 : 30) * DAY),
            subId: d.subscription_id,
            trialUsed: true,
          },
          customerEmail
        );
      }
      break;

    case 'subscription.renewed': // trial converted, or a normal renewal: reset credits, extend access
      await db.renewPlan(
        userId,
        {
          credits: PLAN_CREDITS,
          renewAt: d.next_billing_date,
        },
        customerEmail
      );
      break;

    case 'subscription.past_due': // grace period: keep access until d.past_due_ends_at
    case 'subscription.on_hold': // ask the user to update their payment method
      await db.markPlanState(userId, event.type, customerEmail);
      break;

    case 'subscription.failed':
    case 'subscription.expired':
    case 'subscription.cancelled':
      await db.endPlan(userId, event.type, customerEmail); // decide whether access runs to the end of the paid period
      break;

    case 'payment.succeeded':
      if (meta.mode === 'topup') {
        const credits = PACK_CREDITS[Number(meta.pack)] || PACK_CREDITS[0];
        await db.addTopup(
          userId,
          {
            n: credits,
            exp: Date.now() + TOPUP_DAYS * DAY,
            paymentId: d.payment_id,
          },
          customerEmail
        );
      } else if (meta.mode === 'trial') {
        await db.setPlan(
          userId,
          {
            kind: 'trial',
            next: meta.plan || 'monthly',
            credits: PLAN_CREDITS,
            trialUsed: true,
            renewAt: d.next_billing_date || (Date.now() + 7 * DAY),
            subId: d.subscription_id,
          },
          customerEmail
        );
      } else if (meta.mode === 'direct') {
        await db.setPlan(
          userId,
          {
            kind: meta.plan || 'monthly',
            credits: PLAN_CREDITS,
            renewAt: d.next_billing_date || (Date.now() + (meta.plan === 'annual' ? 365 : 30) * DAY),
            subId: d.subscription_id,
            trialUsed: true,
          },
          customerEmail
        );
      }
      break;

    default:
      console.log(`[Dodo Webhook] Unhandled event type: ${event.type}`);
      break;
  }

  return NextResponse.json({ received: true });
}
