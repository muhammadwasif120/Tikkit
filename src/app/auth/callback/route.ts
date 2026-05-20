import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      const admin = createAdminClient()

      // Read role from auth.users directly — most reliable source
      const { data: authData } = await admin.auth.admin.getUserById(user.id)
      const metaRole = authData?.user?.user_metadata?.role as string | undefined

      // Look up their profile role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Profile role wins; metadata is the fallback; never default to guest
      // unless both are genuinely absent
      const role = profile?.role ?? metaRole ?? 'guest'

      // If profile row is missing, create it now via admin client
      if (!profile) {
        await admin.from('profiles').upsert({
          id:        user.id,
          email:     user.email ?? '',
          full_name: user.user_metadata?.full_name ?? '',
          role:      role,
        }, { onConflict: 'id', ignoreDuplicates: true })
      }

      // Ensure guest_profile exists for attendees
      if (role === 'guest') {
        await admin.from('guest_profiles')
          .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })
      }

      const destination = role === 'guest' ? '/explore' : '/dashboard'
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
