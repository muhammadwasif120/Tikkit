'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const EMAILS = { organizer: 'demo.organizer@demo.tikkitx.com', attendee: 'demo.attendee@demo.tikkitx.com' } as const
const HOME = { organizer: '/dashboard', attendee: '/guest' } as const

/** Signs the visitor into a shared demo account with a one time link. No password exists for those accounts. */
export async function startDemo(formData: FormData) {
  const role = formData.get('role') === 'attendee' ? 'attendee' : 'organizer'
  if (process.env.DEMO_ENABLED !== '1') redirect('/demo?demo=unavailable')
  // 20 demo sign-ins per visitor per 10 minutes. Each one asks the auth service for a one time link.
  if (!(await checkRateLimit(`demo:${await getClientIp()}`, 20))) redirect('/demo?demo=busy')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user && user.app_metadata?.demo !== true) redirect('/demo?demo=loggedin')
  if (user && user.email === EMAILS[role]) redirect(HOME[role])

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAILS[role] })
  const hash = data?.properties?.hashed_token
  if (error || !hash) redirect('/demo?demo=unavailable')

  const { error: verr } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: hash })
  if (verr) redirect('/demo?demo=unavailable')
  redirect(HOME[role])
}

/** Rebuilds the sample data. Only a demo session may call it, and the database enforces a one minute cooldown. */
export async function resetDemo(): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.demo !== true) return { ok: false, message: 'Not available.' }

  const admin = createAdminClient() as unknown as { rpc: (fn: string, args: object) => PromiseLike<{ data: boolean | null; error: { message: string } | null }> }
  const { data, error } = await admin.rpc('demo_reseed', { p_force: false })
  if (error) return { ok: false, message: 'Could not reset right now.' }
  revalidatePath('/dashboard', 'layout')
  return data ? { ok: true, message: 'Sample data restored.' } : { ok: false, message: 'Reset just ran. Try again in a minute.' }
}
