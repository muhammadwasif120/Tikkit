import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Upsert profile as guest
      await supabase.from('profiles').upsert({
        id:        user.id,
        email:     user.email!,
        full_name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
        role:      'guest',
      }, { onConflict: 'id', ignoreDuplicates: true })

      // Ensure guest_profile exists
      const { data: gp } = await supabase
        .from('guest_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!gp) {
        await supabase.from('guest_profiles').insert({ id: user.id })
      }

      return NextResponse.redirect(`${origin}/explore`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}