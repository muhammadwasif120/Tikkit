import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const next  = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Look up their role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role ?? user.user_metadata?.role ?? 'guest'

      // Ensure guest_profile exists for attendees
      if (role === 'guest') {
        await supabase.from('guest_profiles')
          .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })
      }

      const destination = role === 'guest' ? '/explore' : '/dashboard'
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}