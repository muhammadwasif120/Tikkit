'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const DEMO_EMAIL = 'demo.organizer@demo.tikkitx.com'

/** Signs the visitor into the shared demo organizer with a one time link. No password exists for that account. */
export async function startDemo() {
  if (process.env.DEMO_ENABLED !== '1') redirect('/demo?demo=unavailable')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user && user.app_metadata?.demo !== true) redirect('/demo?demo=loggedin')
  if (user) redirect('/dashboard')

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: DEMO_EMAIL })
  const hash = data?.properties?.hashed_token
  if (error || !hash) redirect('/demo?demo=unavailable')

  const { error: verr } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: hash })
  if (verr) redirect('/demo?demo=unavailable')
  redirect('/dashboard')
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
