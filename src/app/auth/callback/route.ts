import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const safeNext = (n: string | null) => (n && /^\/(?![\/\\])[^\u0000-\u001f\\]*$/.test(n) ? n : null)

/** Email confirmation, password recovery and Google sign in all land here with a code. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      let home = profile?.role === 'organizer' ? '/dashboard' : profile?.role === 'admin' ? '/master' : '/guest'
      if (profile?.role === 'attendee') {
        await supabase.rpc('claim_team_invites')
        await supabase.rpc('claim_registrations')
        const { data: team } = await supabase.from('organizer_team_members').select('id').eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle()
        if (team) home = '/dashboard'
      }
      return NextResponse.redirect(`${origin}${next ?? home}`)
    }
  }
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
