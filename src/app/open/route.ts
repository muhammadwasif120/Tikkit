import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** The installed app's start page. Sends each person to their own home. */
export async function GET(request: Request) {
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url))
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return to('/auth/login')
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return to(p?.role === 'organizer' ? '/dashboard' : p?.role === 'admin' ? '/master' : '/guest')
}
