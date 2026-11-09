import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getAppOrigin } from '@/lib/config';

// Base64URL decode helper
function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

// Verify HMAC-SHA256 JWT
async function verifyJwt(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = `${headerB64}.${payloadB64}`;
    
    // Reconstruct binary signature from base64url
    const sigStr = atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(data)
    );

    if (!isValid) return null;

    const payload = JSON.parse(base64urlDecode(payloadB64));

    // Expiry check
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.warn('Partner token expired');
      return null;
    }

    return payload;
  } catch (err) {
    console.error('JWT verification error:', err);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const origin = getAppOrigin(request);
  const isEmbed = searchParams.get('embed') === '1' || searchParams.get('embed') === 'true';

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=Missing+partner+authentication+token`);
  }

  const ssoSecret = process.env.DOUBTSTER_SSO_SECRET || 'italostudy_doubtster_sso_shared_secret_2026';
  const payload = await verifyJwt(token, ssoSecret);

  if (!payload || !payload.email) {
    return NextResponse.redirect(`${origin}/login?error=Invalid+or+expired+partner+token`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpsauvbbcpnzmocoacfw.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY on Doubtster backend');
    return NextResponse.redirect(`${origin}/login?error=Authentication+service+configuration+error`);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const email = String(payload.email).trim().toLowerCase();
  const studentName = payload.name || email.split('@')[0];
  let userId: string | null = null;

  try {
    // 1. Automatically create user in Doubtster Auth if they don't already exist
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: studentName,
        name: studentName,
        partner: 'italostudy',
        italostudy_id: payload.sub,
        italostudy_tier: payload.tier || 'explorer',
      }
    });

    if (newUser?.user) {
      userId = newUser.user.id;
    }

    // 2. Generate Magic Link session for seamless automatic login (works for both new and existing users)
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error('Failed to generate session link in Doubtster:', linkErr);
      return NextResponse.redirect(`${origin}/login?error=Failed+to+establish+session`);
    }

    if (!userId && linkData?.user) {
      userId = linkData.user.id;
    }

    // 3. Update user metadata for existing users
    if (userId) {
      try {
        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: {
            full_name: studentName,
            name: studentName,
            partner: 'italostudy',
            italostudy_id: payload.sub,
            italostudy_tier: payload.tier || 'explorer',
          }
        });
      } catch (metaErr) {
        console.warn('Could not update metadata for user:', metaErr);
      }
    }

    // 4. Credit 10 free credits to their Doubtster balance (for ItaloStudy Elite/Global)
    const creditsToGrant = typeof payload.credits === 'number' ? payload.credits : 0;
    if (creditsToGrant > 0 && userId) {
      try {
        const { data: stateData } = await adminClient
          .from('app_state')
          .select('state')
          .eq('user_id', userId)
          .maybeSingle();

        let state = (stateData?.state || {}) as Record<string, any>;
        const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-11"

        // Credit 10 free credits if not already credited this month
        if (state.italostudy_credited_month !== currentMonth) {
          state.pcredits = Math.max((state.pcredits || 0), creditsToGrant);
          state.italostudy_credited_month = currentMonth;
          state.partner = 'italostudy';

          await adminClient.from('app_state').upsert(
            {
              user_id: userId,
              state,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
        }
      } catch (creditErr) {
        console.warn('Could not update credits in app_state:', creditErr);
      }
    }

    // 5. Establish browser session cookies directly onto the redirect response
    const targetUrl = `${origin}/app${isEmbed ? '?embed=1' : ''}`;
    const redirectResponse = NextResponse.redirect(targetUrl);

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || serviceRoleKey;
    const serverClient = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie') || '';
          return cookieHeader.split(';').map(c => {
            const [name, ...v] = c.trim().split('=');
            return { name, value: v.join('=') };
          }).filter(c => c.name);
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, {
              ...options,
              path: '/',
              sameSite: 'none',
              secure: true,
            });
          });
        },
      },
    });

    const { error: verifyErr } = await serverClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (verifyErr) {
      console.error('Error setting session cookies in Doubtster:', verifyErr);
      if (linkData.properties.action_link) {
        return NextResponse.redirect(linkData.properties.action_link);
      }
    }

    redirectResponse.headers.set(
      'Content-Security-Policy',
      "frame-ancestors *"
    );

    return redirectResponse;
  } catch (err: any) {
    console.error('Partner login error:', err);
    return NextResponse.redirect(`${origin}/login?error=Authentication+processing+failed`);
  }
}

