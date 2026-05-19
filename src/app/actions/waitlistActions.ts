'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function joinPlatformWaitlist(data: {
  full_name: string
  email: string
  phone?: string
  role: 'organizer' | 'guest' | 'both'
}) {
  // Input length validation
  if (!data.full_name || data.full_name.trim().length < 2)
    return { error: 'Please enter your full name.' }
  if (data.full_name.length > 100)
    return { error: 'Name must be 100 characters or fewer.' }
  if (!data.email || data.email.length > 255)
    return { error: 'Please enter a valid email address.' }
  if (data.phone && data.phone.length > 20)
    return { error: 'Phone number is too long.' }
  if (!['organizer', 'guest', 'both'].includes(data.role))
    return { error: 'Invalid role.' }

  // IP-based rate limit: 3 signups per IP per hour (prevents bot bulk-inserts)
  const ip = await getClientIp()
  if (!checkRateLimit(`waitlist:${ip}`, 3, 3_600_000)) {
    return { error: 'Too many requests. Please try again later.' }
  }

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
