import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpsauvbbcpnzmocoacfw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'

const CSP_FRAME_ANCESTORS = "frame-ancestors 'self' https://app.italostudy.com https://italostudy.com http://localhost:5173 http://localhost:3000 https://*.italostudy.com"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Ensure CSP frame-ancestors is present on all responses for ItaloStudy embedding
  supabaseResponse.headers.set('Content-Security-Policy', CSP_FRAME_ANCESTORS);

  // If Supabase environment variables are missing (e.g. unconfigured deployment), pass through
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            supabaseResponse.headers.set('Content-Security-Policy', CSP_FRAME_ANCESTORS);
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, {
                ...options,
                sameSite: 'none',
                secure: true,
              })
            )
          } catch {
            // Non-mutating context
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDevBypass = process.env.NODE_ENV === 'development' && (request.cookies.get('dev_auth')?.value === 'true' || request.nextUrl.searchParams.get('dev_auth') === 'true');

  const getRedirectUrl = (pathname: string) => {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    if (host && !host.includes('localhost')) {
      return new URL(pathname, `${proto}://${host}`);
    }
    if (process.env.NODE_ENV === 'production') {
      return new URL(pathname, 'https://app.doubtster.com');
    }
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    return url;
  };

  const isEmbed = request.nextUrl.searchParams.get('embed') === '1' || request.nextUrl.searchParams.get('embed') === 'true';

  if (
    !user &&
    !isDevBypass &&
    (request.nextUrl.pathname.startsWith('/app') || request.nextUrl.pathname.startsWith('/onboarding'))
  ) {
    const target = isEmbed ? '/login?embed=1' : '/login';
    const redirectRes = NextResponse.redirect(getRedirectUrl(target));
    redirectRes.headers.set('Content-Security-Policy', CSP_FRAME_ANCESTORS);
    return redirectRes;
  }

  // If user is logged in, redirect them away from auth pages to /app
  if (
    user &&
    (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))
  ) {
    const target = isEmbed ? '/app?embed=1' : '/app';
    const redirectRes = NextResponse.redirect(getRedirectUrl(target));
    redirectRes.headers.set('Content-Security-Policy', CSP_FRAME_ANCESTORS);
    return redirectRes;
  }

  return supabaseResponse
}
