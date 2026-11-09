import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const targetUrl = new URL(`/api/auth/partner-login${url.search}`, url.origin);
  return NextResponse.redirect(targetUrl.toString());
}

