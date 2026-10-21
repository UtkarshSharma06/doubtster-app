import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/subscriptionDb';

export interface PlanAccessResult {
  allowed: boolean;
  status: number;
  error?: string;
  user?: any;
  state?: any;
  plan?: any;
  credits?: number;
}

/**
 * Checks if a plan object represents an active paid subscription or trial
 */
export function isPlanActive(plan: any): boolean {
  if (!plan) return false;
  const now = Date.now();

  if (plan.status === 'expired' || plan.status === 'failed') {
    return false;
  }

  if (plan.kind === 'trial') {
    const trialEnd = plan.renewAt
      ? (typeof plan.renewAt === 'number' ? plan.renewAt : new Date(plan.renewAt).getTime())
      : (plan.start || 0) + 7 * 86400000;
    return now <= trialEnd;
  }

  if (plan.kind === 'monthly' || plan.kind === 'annual') {
    if (plan.cancelled && plan.renewAt) {
      const renewTime = typeof plan.renewAt === 'number' ? plan.renewAt : new Date(plan.renewAt).getTime();
      return now <= renewTime;
    }
    return plan.status === 'active' || !plan.cancelled;
  }

  return false;
}

/**
 * Strictly verifies that the user is authenticated and has an active Pro plan or trial.
 * Used to protect Notes, Video generation, Flashcards, and Quizzes. Only chat is free.
 */
export async function verifyPlanAccess(featureName: string = 'This feature'): Promise<PlanAccessResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        allowed: false,
        status: 401,
        error: `Please log in and subscribe to Doubtster Pro to access ${featureName}. Chat is free forever.`,
      };
    }

    const state = await db.getUserState(user.id);

    // Merge any pending webhook update
    const pending = db.getPendingUpdate(user.id, user.email || undefined);
    if (pending) {
      if (pending.plan !== undefined) state.plan = pending.plan;
      if (pending.pcredits !== undefined) state.pcredits = pending.pcredits;
      if (pending.trialUsed !== undefined) state.trialUsed = pending.trialUsed;
      if (pending.topup) {
        if (!Array.isArray(state.topups)) state.topups = [];
        state.topups.push(pending.topup);
      }
    }

    const active = isPlanActive(state.plan);
    const now = Date.now();
    const topups = Array.isArray(state.topups)
      ? state.topups.filter((t: any) => t.exp > now && t.n > 0)
      : [];
    const topupCredits = topups.reduce((sum: number, t: any) => sum + (t.n || 0), 0);
    const totalCredits = (state.pcredits || 0) + topupCredits;

    if (!active) {
      return {
        allowed: false,
        status: 403,
        error: `${featureName} requires an active Doubtster Pro plan or 7-day trial. Only chat is free.`,
        user,
        state,
        plan: state.plan,
        credits: totalCredits,
      };
    }

    return {
      allowed: true,
      status: 200,
      user,
      state,
      plan: state.plan,
      credits: totalCredits,
    };
  } catch (err: any) {
    console.error('Plan verification error:', err);
    return {
      allowed: false,
      status: 500,
      error: 'Failed to verify subscription status. Please try again.',
    };
  }
}
