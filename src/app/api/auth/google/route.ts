import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${new URL(request.url).origin}/api/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data.url) {
    return NextResponse.redirect(data.url)
  }

  return NextResponse.json({ error: 'Failed to generate OAuth URL' }, { status: 500 })
}
