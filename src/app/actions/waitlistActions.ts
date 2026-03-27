'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function joinPlatformWaitlist(data: {
  full_name: string
  email: string
  phone?: string
  role: 'organizer' | 'guest' | 'both'
}) {
  const supabase = createAdminClient()

  const { error } = await (supabase as any)
    .from('platform_waitlist')
    .insert({
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      role: data.role,
      source: 'coming_soon',
    })

  if (error) {
    if (error.code === '23505') {
      return { error: "You're already on the list! We'll be in touch soon." }
    }
    return { error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}

export async function getWaitlistCount(): Promise<number> {
  const supabase = createAdminClient()

  const { count } = await (supabase as any)
    .from('platform_waitlist')
    .select('*', { count: 'exact', head: true })

  return count ?? 0
}
