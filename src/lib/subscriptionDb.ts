import { supabaseAdmin } from '@/utils/supabase/admin';

const DAY = 86400000;

// In-memory deduplication set for webhook event IDs
const seenWebhookIds = new Set<string>();

// Pending state cache to bridge webhooks if SUPABASE_SERVICE_ROLE_KEY is pending or if user checked out as guest
interface PendingState {
  plan?: any;
  pcredits?: number;
  trialUsed?: boolean;
  topup?: { n: number; exp: number; paymentId?: string };
  updatedAt: number;
}
const pendingUpdatesByUser = new Map<string, PendingState>();
const pendingUpdatesByEmail = new Map<string, PendingState>();

function isUuid(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function createDefaultState() {
  return {
    v: 2,
    profile: { name: '', level: '', subjects: [], goals: [], style: '' },
    plan: null,
    pcredits: 0,
    topups: [] as Array<{ n: number; exp: number; paymentId?: string }>,
    trialUsed: false,
    offset: 0,
    spent: 0,
    act: {},
    notes: [],
    decks: [],
    quizzes: [],
    videos: [],
    tasks: [],
  };
}

export const db = {
  /**
   * De-duplicate incoming Dodo webhook retries
   */
  async webhookSeen(webhookId: string): Promise<boolean> {
    if (!webhookId) return false;
    if (seenWebhookIds.has(webhookId)) {
      return true;
    }
    seenWebhookIds.add(webhookId);
    // Keep cache bounded
    if (seenWebhookIds.size > 2000) {
      const first = seenWebhookIds.values().next().value;
      if (first) seenWebhookIds.delete(first);
    }

    // Try checking/recording in dodo_webhook_events table if it exists in Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('dodo_webhook_events')
        .select('webhook_id')
        .eq('webhook_id', webhookId)
        .maybeSingle();

      if (!error && data) {
        return true;
      }
      if (!error) {
        await supabaseAdmin
          .from('dodo_webhook_events')
          .insert({ webhook_id: webhookId, created_at: new Date().toISOString() });
      }
    } catch {
      // Table may not exist yet, memory deduplication is active
    }

    return false;
  },

  /**
   * Resolve user id from session metadata or customer email
   */
  async resolveUserId(metaUserId?: string, customerEmail?: string): Promise<string | null> {
    if (isUuid(metaUserId)) {
      return metaUserId!;
    }

    if (customerEmail) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (!error && data?.users) {
          const match = data.users.find(
            (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
          );
          if (match) return match.id;
        }
      } catch (err) {
        console.warn('[Dodo Webhook] Could not list auth users to match email:', err);
      }
    }

    return null;
  },

  /**
   * Load user state from Supabase app_state
   */
  async getUserState(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('app_state')
        .select('state')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.state) {
        return { ...createDefaultState(), ...data.state };
      }
    } catch (e) {
      console.warn('[Dodo Webhook] Error fetching user state:', e);
    }
    return createDefaultState();
  },

  /**
   * Save user state to Supabase app_state
   */
  async saveUserState(userId: string, state: any, customerEmail?: string) {
    if (!isUuid(userId)) {
      if (customerEmail) {
        pendingUpdatesByEmail.set(customerEmail.toLowerCase(), {
          plan: state.plan,
          pcredits: state.pcredits,
          trialUsed: state.trialUsed,
          updatedAt: Date.now(),
        });
      }
      return;
    }

    try {
      const { error } = await supabaseAdmin.from('app_state').upsert(
        {
          user_id: userId,
          state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.warn(
          `[Dodo Webhook] Supabase upsert returned warning (${error.message}). Stashing in pending memory cache.`
        );
        pendingUpdatesByUser.set(userId, {
          plan: state.plan,
          pcredits: state.pcredits,
          trialUsed: state.trialUsed,
          updatedAt: Date.now(),
        });
      } else {
        // Successfully saved in Supabase
        pendingUpdatesByUser.delete(userId);
      }
    } catch (e: any) {
      console.error('[Dodo Webhook] Failed to save state to Supabase:', e.message);
      pendingUpdatesByUser.set(userId, {
        plan: state.plan,
        pcredits: state.pcredits,
        trialUsed: state.trialUsed,
        updatedAt: Date.now(),
      });
    }
  },

  /**
   * Set user subscription plan and initial credits (Trial or Direct Paid)
   */
  async setPlan(
    userId: string,
    params: {
      kind: string;
      next?: string;
      credits: number;
      trialUsed?: boolean;
      renewAt?: string | number | null;
      subId?: string | null;
    },
    customerEmail?: string
  ) {
    const s = await this.getUserState(userId);
    const now = Date.now();
    const renewTime = params.renewAt
      ? typeof params.renewAt === 'number'
        ? params.renewAt
        : new Date(params.renewAt).getTime()
      : params.kind === 'trial'
      ? now + 7 * DAY
      : now + (params.kind === 'annual' ? 365 : 30) * DAY;

    if (params.kind === 'trial') {
      s.plan = {
        kind: 'trial',
        next: params.next || 'monthly',
        start: now,
        renewAt: renewTime,
        cancelled: false,
        subId: params.subId || null,
        status: 'active',
      };
      s.pcredits = params.credits;
      s.trialUsed = true;
    } else {
      s.plan = {
        kind: params.kind,
        start: now,
        renewAt: renewTime,
        credAt: now + 30 * DAY,
        cancelled: false,
        subId: params.subId || null,
        status: 'active',
      };
      s.pcredits = params.credits;
      if (params.trialUsed !== undefined) {
        s.trialUsed = params.trialUsed;
      }
    }

    await this.saveUserState(userId, s, customerEmail);
  },

  /**
   * Renew subscription (reset credits to 30, extend billing date)
   */
  async renewPlan(
    userId: string,
    params: { credits: number; renewAt?: string | number | null },
    customerEmail?: string
  ) {
    const s = await this.getUserState(userId);
    const now = Date.now();
    const renewTime = params.renewAt
      ? typeof params.renewAt === 'number'
        ? params.renewAt
        : new Date(params.renewAt).getTime()
      : (s.plan?.renewAt || now) + 30 * DAY;

    s.pcredits = params.credits;
    if (s.plan) {
      if (s.plan.kind === 'trial') {
        s.plan.kind = s.plan.next || 'monthly';
      }
      s.plan.renewAt = renewTime;
      s.plan.cancelled = false;
      s.plan.status = 'active';
    } else {
      s.plan = {
        kind: 'monthly',
        start: now,
        renewAt: renewTime,
        credAt: now + 30 * DAY,
        cancelled: false,
        status: 'active',
      };
    }

    await this.saveUserState(userId, s, customerEmail);
  },

  /**
   * Mark plan grace period or on hold
   */
  async markPlanState(userId: string, status: string, customerEmail?: string) {
    const s = await this.getUserState(userId);
    if (s.plan) {
      s.plan.status = status;
      await this.saveUserState(userId, s, customerEmail);
    }
  },

  /**
   * End subscription plan (cancelled, expired, failed)
   */
  async endPlan(userId: string, status: string, customerEmail?: string) {
    const s = await this.getUserState(userId);
    if (s.plan) {
      s.plan.cancelled = true;
      s.plan.status = status;
      if (status === 'subscription.expired' || status === 'subscription.failed') {
        s.pcredits = 0;
      }
      await this.saveUserState(userId, s, customerEmail);
    }
  },

  /**
   * Add top-up video credits pack (valid for 90 days)
   */
  async addTopup(
    userId: string,
    params: { n: number; exp: number; paymentId?: string },
    customerEmail?: string
  ) {
    const s = await this.getUserState(userId);
    if (!Array.isArray(s.topups)) {
      s.topups = [];
    }
    s.topups.push({
      n: params.n,
      exp: params.exp,
      paymentId: params.paymentId,
    });

    await this.saveUserState(userId, s, customerEmail);
  },

  /**
   * Retrieve any pending updates to merge into authenticated user session
   */
  getPendingUpdate(userId: string, email?: string): PendingState | null {
    if (pendingUpdatesByUser.has(userId)) {
      const p = pendingUpdatesByUser.get(userId)!;
      return p;
    }
    if (email && pendingUpdatesByEmail.has(email.toLowerCase())) {
      const p = pendingUpdatesByEmail.get(email.toLowerCase())!;
      return p;
    }
    return null;
  },

  /**
   * Clear pending update once merged
   */
  clearPendingUpdate(userId: string, email?: string) {
    pendingUpdatesByUser.delete(userId);
    if (email) pendingUpdatesByEmail.delete(email.toLowerCase());
  },
};
